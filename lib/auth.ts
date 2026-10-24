import { cache } from "react";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { sessions, users, type Session } from "@/db/schema";
import type { Role } from "./constants";
import { hashSessionToken, SESSION_COOKIE } from "./session";

/** The viewer as exposed to pages and actions — never includes the password hash. */
export type SessionUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
};

export type AuthSession = { user: SessionUser; session: Session };

/**
 * Resolves the session cookie to its user. Wrapped in React cache() so one
 * request resolves it once regardless of how many components ask (§3.3).
 * Expired sessions and deactivated users resolve to null.
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, hashSessionToken(token)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (row.session.expiresAt.getTime() <= Date.now()) return null;
  if (!row.user.isActive) return null;

  return {
    session: row.session,
    user: {
      id: row.user.id,
      fullName: row.user.fullName,
      email: row.user.email,
      phone: row.user.phone,
      role: row.user.role,
      createdAt: row.user.createdAt,
    },
  };
});

/** The middleware forwards the requested path so login can return here (§5.5). */
async function currentPath(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("x-pathname") ?? "/portal";
}

export async function requireUser(): Promise<AuthSession> {
  const auth = await getSession();
  if (!auth) {
    redirect(`/login?next=${encodeURIComponent(await currentPath())}`);
  }
  return auth;
}

export async function requireAdmin(): Promise<AuthSession> {
  const auth = await requireUser();
  if (auth.user.role !== "admin") redirect("/portal");
  return auth;
}

export function portalPathFor(role: Role): string {
  return role === "admin" ? "/admin" : "/portal";
}

/**
 * Open-redirect guard (§5.5): only same-site paths that start with a single
 * slash are honoured.
 */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
