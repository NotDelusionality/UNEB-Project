"use server";

import { redirect } from "next/navigation";
import { getSession, portalPathFor, safeNextPath } from "@/lib/auth";
import { createUser, getUserByEmail } from "@/lib/data/users";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import {
  clearLoginFailures,
  loginLockedUntil,
  recordLoginFailure,
} from "@/lib/rate-limit";
import {
  clearSessionCookie,
  createSession,
  deleteSessionById,
  setSessionCookie,
} from "@/lib/session";
import {
  fieldErrorsOf,
  loginSchema,
  registerSchema,
  type ActionResult,
} from "@/lib/validation";

export async function register(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const existing = await getSession();
  if (existing) redirect(portalPathFor(existing.user.role));

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const { fullName, email, phone, password } = parsed.data;
  if (await getUserByEmail(email)) {
    return {
      ok: false,
      fieldErrors: { email: "An account with this email already exists." },
    };
  }

  const passwordHash = await hashPassword(password);
  let userId: number;
  try {
    const user = await createUser({ fullName, email, passwordHash, phone });
    userId = user.id;
  } catch (error) {
    // Covers the race where the same email registers twice at once.
    if (String(error).includes("UNIQUE")) {
      return {
        ok: false,
        fieldErrors: { email: "An account with this email already exists." },
      };
    }
    throw error;
  }

  const { token } = await createSession(userId);
  await setSessionCookie(token);
  redirect("/portal");
}

export async function login(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const existing = await getSession();
  if (existing) redirect(portalPathFor(existing.user.role));

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: fieldErrorsOf(parsed.error) };
  }
  const { email, password } = parsed.data;

  const lockedUntil = loginLockedUntil(email);
  if (lockedUntil) {
    const minutes = Math.max(
      1,
      Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000),
    );
    return {
      ok: false,
      formError: `Too many failed attempts for this email. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  // One generic message regardless of which part failed (§5.5).
  const genericFailure: ActionResult = {
    ok: false,
    formError: "Incorrect email or password.",
  };

  const user = await getUserByEmail(email);
  if (!user) {
    recordLoginFailure(email);
    return genericFailure;
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    recordLoginFailure(email);
    return genericFailure;
  }

  if (!user.isActive) {
    return {
      ok: false,
      formError: "This account has been deactivated. Contact the administration.",
    };
  }

  clearLoginFailures(email);
  const { token } = await createSession(user.id);
  await setSessionCookie(token);

  const next = safeNextPath(formData.get("next"));
  redirect(next ?? portalPathFor(user.role));
}

export async function logout(): Promise<void> {
  const auth = await getSession();
  if (auth) {
    await deleteSessionById(auth.session.id);
  }
  await clearSessionCookie();
  redirect("/");
}
