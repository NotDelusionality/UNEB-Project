import { createHash, randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { sessions, type Session } from "@/db/schema";

export const SESSION_COOKIE = "session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Sliding expiry (§5.4): renew once less than half the lifetime remains.
const RENEWAL_THRESHOLD_MS = SESSION_TTL_MS / 2;

/**
 * Only the SHA-256 of the token is stored, so a leaked database reveals
 * no usable session tokens (§5.3).
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db
    .insert(sessions)
    .values({ id: hashSessionToken(token), userId, expiresAt });
  return { token, expiresAt };
}

/** Cookie writes are legal only inside server actions and route handlers (§3.4). */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function deleteSessionById(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/** Used on password change (keep the current session) and on deactivation (drop all). */
export async function deleteUserSessions(
  userId: number,
  exceptSessionId?: string,
): Promise<void> {
  await db
    .delete(sessions)
    .where(
      exceptSessionId
        ? and(eq(sessions.userId, userId), ne(sessions.id, exceptSessionId))
        : eq(sessions.userId, userId),
    );
}

/**
 * Sliding renewal (§5.4). Called from authenticated server actions; skipped
 * during pure renders where cookie writes are forbidden.
 */
export async function renewSessionIfNeeded(session: Session): Promise<void> {
  const remaining = session.expiresAt.getTime() - Date.now();
  if (remaining >= RENEWAL_THRESHOLD_MS) return;

  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || hashSessionToken(token) !== session.id) return;

  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db
    .update(sessions)
    .set({ expiresAt })
    .where(eq(sessions.id, session.id));
  await setSessionCookie(token);
}
