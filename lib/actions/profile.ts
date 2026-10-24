"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  getUserById,
  updateUserPassword,
  updateUserProfile,
} from "@/lib/data/users";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { deleteUserSessions, renewSessionIfNeeded } from "@/lib/session";
import {
  changePasswordSchema,
  fieldErrorsOf,
  profileSchema,
  type ActionResult,
} from "@/lib/validation";

/** The shell shows the viewer's name, so both portal layouts are refreshed. */
function revalidateProfileSurfaces(): void {
  revalidatePath("/portal", "layout");
  revalidatePath("/admin", "layout");
}

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, session } = await requireUser();
  await renewSessionIfNeeded(session);

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  await updateUserProfile(user.id, parsed.data);
  revalidateProfileSurfaces();
  return { ok: true, message: "Profile updated" };
}

export async function changePassword(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const { user, session } = await requireUser();
  await renewSessionIfNeeded(session);

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const account = await getUserById(user.id);
  if (!account) return { ok: false, formError: "Account not found." };

  const currentValid = await verifyPassword(
    parsed.data.currentPassword,
    account.passwordHash,
  );
  if (!currentValid) {
    return {
      ok: false,
      fieldErrors: { currentPassword: "The current password is incorrect." },
    };
  }

  await updateUserPassword(user.id, await hashPassword(parsed.data.newPassword));
  // Every other session of this user is closed (§5.6).
  await deleteUserSessions(user.id, session.id);

  return { ok: true, message: "Password changed" };
}
