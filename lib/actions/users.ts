"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  getUserById,
  setUserActive as storeUserActive,
  setUserRole as storeUserRole,
} from "@/lib/data/users";
import { deleteUserSessions, renewSessionIfNeeded } from "@/lib/session";
import { roleSchema, type ActionResult } from "@/lib/validation";

export async function setUserActive(
  userId: number,
  isActive: boolean,
): Promise<ActionResult> {
  const { user, session } = await requireAdmin();
  await renewSessionIfNeeded(session);

  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, formError: "User not found." };
  }
  // Self-deactivation guard (§6).
  if (userId === user.id) {
    return { ok: false, formError: "You cannot deactivate your own account." };
  }

  const target = await getUserById(userId);
  if (!target) return { ok: false, formError: "User not found." };

  await storeUserActive(userId, isActive);
  if (!isActive) {
    // Deactivation invalidates every open session immediately (§5.6).
    await deleteUserSessions(userId);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return {
    ok: true,
    message: isActive ? "Account reactivated" : "Account deactivated",
  };
}

export async function setUserRole(
  userId: number,
  role: string,
): Promise<ActionResult> {
  const { user, session } = await requireAdmin();
  await renewSessionIfNeeded(session);

  if (!Number.isInteger(userId) || userId <= 0) {
    return { ok: false, formError: "User not found." };
  }
  // Self-demotion guard (§6).
  if (userId === user.id) {
    return { ok: false, formError: "You cannot change your own role." };
  }

  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) {
    return { ok: false, formError: "Unknown role." };
  }

  const target = await getUserById(userId);
  if (!target) return { ok: false, formError: "User not found." };

  await storeUserRole(userId, parsedRole.data);
  revalidatePath("/admin/users");
  return { ok: true, message: "Role updated" };
}
