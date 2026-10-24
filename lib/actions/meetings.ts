"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createMeeting as insertMeeting,
  deleteMeeting as removeMeeting,
} from "@/lib/data/meetings";
import { renewSessionIfNeeded } from "@/lib/session";
import {
  fieldErrorsOf,
  meetingSchema,
  type ActionResult,
} from "@/lib/validation";

function revalidateMeetingSurfaces(): void {
  revalidatePath("/");
  revalidatePath("/portal");
  revalidatePath("/portal/meetings");
  revalidatePath("/admin");
  revalidatePath("/admin/meetings");
}

export async function createMeeting(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, session } = await requireAdmin();
  await renewSessionIfNeeded(session);

  const parsed = meetingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { title, venue, description, meetingDate } = parsed.data;
  await insertMeeting({
    title,
    venue,
    description: description ?? null,
    meetingDate,
    authorId: user.id,
  });
  revalidateMeetingSurfaces();
  return { ok: true, message: "Meeting scheduled" };
}

export async function deleteMeeting(id: number): Promise<ActionResult> {
  const { session } = await requireAdmin();
  await renewSessionIfNeeded(session);

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, formError: "Meeting not found." };
  }

  await removeMeeting(id);
  revalidateMeetingSurfaces();
  return { ok: true, message: "Meeting deleted" };
}
