"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { STATUS_META } from "@/lib/constants";
import {
  applyStatusChange,
  deleteReportCascade,
  getReportForViewer,
  insertComment,
  insertReport,
} from "@/lib/data/reports";
import { getActiveAdminIds } from "@/lib/data/users";
import { caseNumber } from "@/lib/format";
import { renewSessionIfNeeded } from "@/lib/session";
import { deleteReportImage, saveReportImage } from "@/lib/uploads";
import {
  commentSchema,
  fieldErrorsOf,
  reportSchema,
  statusChangeSchema,
  type ActionResult,
} from "@/lib/validation";

function parseId(value: unknown): number | null {
  const id = typeof value === "string" ? Number(value) : value;
  return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
}

/** Routes whose data reflects report totals or lists. */
function revalidateReportSurfaces(reportId?: number): void {
  revalidatePath("/");
  revalidatePath("/portal");
  revalidatePath("/portal/reports");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/analytics");
  if (reportId) {
    revalidatePath(`/portal/reports/${reportId}`);
    revalidatePath(`/admin/reports/${reportId}`);
  }
}

export async function createReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, session } = await requireUser();
  await renewSessionIfNeeded(session);
  if (user.role !== "member") {
    return { ok: false, formError: "Only community members submit reports." };
  }

  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  let imagePath: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const saved = await saveReportImage(image);
    if (!saved.ok) {
      return { ok: false, fieldErrors: { image: saved.error } };
    }
    imagePath = saved.filename;
  }

  const adminIds = await getActiveAdminIds();
  const report = await insertReport(
    { ...parsed.data, imagePath, userId: user.id },
    adminIds,
    (id) => `New report ${caseNumber(id)} submitted.`,
  );

  revalidateReportSurfaces(report.id);
  return {
    ok: true,
    message: "Report submitted",
    redirectTo: `/portal/reports/${report.id}`,
  };
}

export async function addComment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, session } = await requireUser();
  await renewSessionIfNeeded(session);

  const reportId = parseId(formData.get("reportId"));
  if (!reportId) return { ok: false, formError: "Report not found." };

  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  // Ownership is enforced inside the query: members only resolve their own
  // reports, admins any (§11).
  const report = await getReportForViewer(reportId, user);
  if (!report) return { ok: false, formError: "Report not found." };

  if (user.role === "member" && report.status === "closed") {
    return {
      ok: false,
      formError: "This case is closed and no longer accepts comments.",
    };
  }

  const recipientIds =
    user.role === "admin"
      ? report.userId === user.id
        ? []
        : [report.userId]
      : await getActiveAdminIds();

  await insertComment({
    reportId,
    authorId: user.id,
    body: parsed.data.body,
    recipientIds,
    message: `New comment on report ${caseNumber(reportId)}.`,
  });

  revalidateReportSurfaces(reportId);
  return { ok: true, message: "Comment added" };
}

export async function updateReportStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, session } = await requireAdmin();
  await renewSessionIfNeeded(session);

  const reportId = parseId(formData.get("reportId"));
  if (!reportId) return { ok: false, formError: "Report not found." };

  const parsed = statusChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const report = await getReportForViewer(reportId, user);
  if (!report) return { ok: false, formError: "Report not found." };

  const { status, comment } = parsed.data;
  if (status === report.status) {
    return {
      ok: false,
      fieldErrors: { status: "The report already has this status." },
    };
  }

  const label = STATUS_META[status].label;
  await applyStatusChange({
    reportId,
    fromStatus: report.status,
    toStatus: status,
    changedBy: user.id,
    ownerId: report.userId,
    comment,
    message: `Status of report ${caseNumber(reportId)} changed to ${label}.`,
  });

  revalidateReportSurfaces(reportId);
  return { ok: true, message: `Status changed to ${label}` };
}

export async function deleteReport(reportId: number): Promise<ActionResult> {
  const { user, session } = await requireUser();
  await renewSessionIfNeeded(session);

  const id = parseId(reportId);
  if (!id) return { ok: false, formError: "Report not found." };

  const report = await getReportForViewer(id, user);
  if (!report) return { ok: false, formError: "Report not found." };

  if (user.role === "member" && report.status !== "pending") {
    return {
      ok: false,
      formError: "A report can only be deleted while it is pending.",
    };
  }

  await deleteReportCascade(id);
  await deleteReportImage(report.imagePath);

  revalidateReportSurfaces();
  return {
    ok: true,
    message: "Report deleted",
    redirectTo: user.role === "admin" ? "/admin/reports" : "/portal/reports",
  };
}
