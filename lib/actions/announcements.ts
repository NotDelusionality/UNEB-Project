"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createAnnouncement as insertAnnouncement,
  deleteAnnouncement as removeAnnouncement,
} from "@/lib/data/announcements";
import { renewSessionIfNeeded } from "@/lib/session";
import {
  announcementSchema,
  fieldErrorsOf,
  type ActionResult,
} from "@/lib/validation";

function revalidateAnnouncementSurfaces(): void {
  revalidatePath("/portal");
  revalidatePath("/portal/announcements");
  revalidatePath("/admin/announcements");
}

export async function createAnnouncement(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, session } = await requireAdmin();
  await renewSessionIfNeeded(session);

  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  await insertAnnouncement({ ...parsed.data, authorId: user.id });
  revalidateAnnouncementSurfaces();
  return { ok: true, message: "Announcement published" };
}

export async function deleteAnnouncement(id: number): Promise<ActionResult> {
  const { session } = await requireAdmin();
  await renewSessionIfNeeded(session);

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, formError: "Announcement not found." };
  }

  await removeAnnouncement(id);
  revalidateAnnouncementSurfaces();
  return { ok: true, message: "Announcement deleted" };
}
