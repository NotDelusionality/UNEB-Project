"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/lib/data/notifications";
import { renewSessionIfNeeded } from "@/lib/session";
import type { ActionResult } from "@/lib/validation";

export async function markNotificationsRead(): Promise<ActionResult> {
  const { user, session } = await requireUser();
  await renewSessionIfNeeded(session);

  await markAllNotificationsRead(user.id);

  // The unread badge sits in both portal shells.
  revalidatePath("/portal", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true, message: "All notifications marked as read" };
}
