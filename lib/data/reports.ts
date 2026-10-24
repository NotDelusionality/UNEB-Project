import { and, asc, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  notifications,
  reportComments,
  reports,
  reportStatusHistory,
  users,
  type Report,
} from "@/db/schema";
import type { ReportCategory, ReportStatus, Role } from "@/lib/constants";
import { OPEN_STATUSES } from "@/lib/constants";

export const REPORTS_PAGE_SIZE = 10;

export type Viewer = { id: number; role: Role };

/**
 * Object-level authorization happens inside the query (§11): members can
 * only ever resolve their own reports; admins can resolve any.
 */
function visibleTo(viewer: Viewer): SQL | undefined {
  return viewer.role === "admin" ? undefined : eq(reports.userId, viewer.id);
}

export async function getReportForViewer(
  id: number,
  viewer: Viewer,
): Promise<(Report & { authorName: string; authorEmail: string }) | null> {
  const rows = await db
    .select({
      report: reports,
      authorName: users.fullName,
      authorEmail: users.email,
    })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.userId))
    .where(and(eq(reports.id, id), visibleTo(viewer)))
    .limit(1);
  const row = rows[0];
  return row ? { ...row.report, authorName: row.authorName, authorEmail: row.authorEmail } : null;
}

export async function getReportByImagePath(
  filename: string,
): Promise<Report | null> {
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.imagePath, filename))
    .limit(1);
  return rows[0] ?? null;
}

export type CommentWithAuthor = {
  id: number;
  body: string;
  createdAt: Date;
  authorId: number;
  authorName: string;
  authorRole: Role;
};

export async function getReportComments(
  reportId: number,
): Promise<CommentWithAuthor[]> {
  return db
    .select({
      id: reportComments.id,
      body: reportComments.body,
      createdAt: reportComments.createdAt,
      authorId: reportComments.authorId,
      authorName: users.fullName,
      authorRole: users.role,
    })
    .from(reportComments)
    .innerJoin(users, eq(users.id, reportComments.authorId))
    .where(eq(reportComments.reportId, reportId))
    .orderBy(asc(reportComments.createdAt), asc(reportComments.id));
}

export type HistoryEntry = {
  id: number;
  fromStatus: string;
  toStatus: string;
  createdAt: Date;
  actorName: string;
};

export async function getReportHistory(
  reportId: number,
): Promise<HistoryEntry[]> {
  return db
    .select({
      id: reportStatusHistory.id,
      fromStatus: reportStatusHistory.fromStatus,
      toStatus: reportStatusHistory.toStatus,
      createdAt: reportStatusHistory.createdAt,
      actorName: users.fullName,
    })
    .from(reportStatusHistory)
    .innerJoin(users, eq(users.id, reportStatusHistory.changedBy))
    .where(eq(reportStatusHistory.reportId, reportId))
    .orderBy(asc(reportStatusHistory.createdAt), asc(reportStatusHistory.id));
}

/** Insert a report and notify every active administrator, atomically. */
export async function insertReport(
  values: {
    title: string;
    description: string;
    category: ReportCategory;
    location: string;
    imagePath: string | null;
    userId: number;
  },
  adminIds: number[],
  buildMessage: (reportId: number) => string,
): Promise<Report> {
  return db.transaction(async (tx) => {
    const [report] = await tx.insert(reports).values(values).returning();
    if (adminIds.length > 0) {
      await tx.insert(notifications).values(
        adminIds.map((userId) => ({
          userId,
          reportId: report.id,
          message: buildMessage(report.id),
        })),
      );
    }
    return report;
  });
}

/** Insert a comment and notify the counterpart(s), atomically (§4). */
export async function insertComment(input: {
  reportId: number;
  authorId: number;
  body: string;
  recipientIds: number[];
  message: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(reportComments).values({
      reportId: input.reportId,
      authorId: input.authorId,
      body: input.body,
    });
    // Touch updated_at so admin sorting reflects activity.
    await tx
      .update(reports)
      .set({ updatedAt: new Date() })
      .where(eq(reports.id, input.reportId));
    if (input.recipientIds.length > 0) {
      await tx.insert(notifications).values(
        input.recipientIds.map((userId) => ({
          userId,
          reportId: input.reportId,
          message: input.message,
        })),
      );
    }
  });
}

/**
 * Status change: report row, history row, optional comment, and the owner
 * notification are written in one transaction (§7.3).
 */
export async function applyStatusChange(input: {
  reportId: number;
  fromStatus: ReportStatus;
  toStatus: ReportStatus;
  changedBy: number;
  ownerId: number;
  comment?: string;
  message: string;
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(reports)
      .set({ status: input.toStatus })
      .where(eq(reports.id, input.reportId));
    await tx.insert(reportStatusHistory).values({
      reportId: input.reportId,
      changedBy: input.changedBy,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
    });
    if (input.comment) {
      await tx.insert(reportComments).values({
        reportId: input.reportId,
        authorId: input.changedBy,
        body: input.comment,
      });
    }
    await tx.insert(notifications).values({
      userId: input.ownerId,
      reportId: input.reportId,
      message: input.message,
    });
  });
}

/** Children are removed explicitly so the delete never depends on FK pragmas. */
export async function deleteReportCascade(reportId: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(notifications).where(eq(notifications.reportId, reportId));
    await tx
      .delete(reportComments)
      .where(eq(reportComments.reportId, reportId));
    await tx
      .delete(reportStatusHistory)
      .where(eq(reportStatusHistory.reportId, reportId));
    await tx.delete(reports).where(eq(reports.id, reportId));
  });
}

export async function listReportsForUser(
  userId: number,
  filters: { status?: ReportStatus; query?: string } = {},
): Promise<Report[]> {
  const conditions: SQL[] = [eq(reports.userId, userId)];
  if (filters.status) conditions.push(eq(reports.status, filters.status));
  if (filters.query) conditions.push(like(reports.title, `%${filters.query}%`));

  return db
    .select()
    .from(reports)
    .where(and(...conditions))
    .orderBy(desc(reports.createdAt), desc(reports.id));
}

export type AdminReportListItem = Report & { reporterName: string };

export async function listReportsAdmin(options: {
  page: number;
  query?: string;
  status?: ReportStatus;
  category?: ReportCategory;
  sort: "newest" | "oldest";
}): Promise<{ rows: AdminReportListItem[]; total: number; pageCount: number }> {
  const conditions: SQL[] = [];
  if (options.query) {
    const pattern = `%${options.query}%`;
    conditions.push(
      or(like(reports.title, pattern), like(reports.location, pattern))!,
    );
  }
  if (options.status) conditions.push(eq(reports.status, options.status));
  if (options.category) conditions.push(eq(reports.category, options.category));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const order =
    options.sort === "oldest"
      ? [asc(reports.createdAt), asc(reports.id)]
      : [desc(reports.createdAt), desc(reports.id)];

  const rows = await db
    .select({ report: reports, reporterName: users.fullName })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.userId))
    .where(where)
    .orderBy(...order)
    .limit(REPORTS_PAGE_SIZE)
    .offset((options.page - 1) * REPORTS_PAGE_SIZE);

  const [{ total }] = await db
    .select({ total: count() })
    .from(reports)
    .where(where);

  return {
    rows: rows.map((row) => ({ ...row.report, reporterName: row.reporterName })),
    total,
    pageCount: Math.max(1, Math.ceil(total / REPORTS_PAGE_SIZE)),
  };
}

export async function recentReportsForUser(
  userId: number,
  limit: number,
): Promise<Report[]> {
  return db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt), desc(reports.id))
    .limit(limit);
}

export async function memberReportStats(userId: number): Promise<{
  total: number;
  open: number;
  resolved: number;
}> {
  const rows = await db
    .select({ status: reports.status, n: count() })
    .from(reports)
    .where(eq(reports.userId, userId))
    .groupBy(reports.status);

  let total = 0;
  let open = 0;
  let resolved = 0;
  for (const row of rows) {
    total += row.n;
    if ((OPEN_STATUSES as readonly string[]).includes(row.status)) open += row.n;
    if (row.status === "resolved") resolved += row.n;
  }
  return { total, open, resolved };
}
