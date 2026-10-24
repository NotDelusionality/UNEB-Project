import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { reports, users, type User } from "@/db/schema";
import type { Role } from "@/lib/constants";

export const USERS_PAGE_SIZE = 10;

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string | null;
}): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ ...input, role: "member" })
    .returning();
  return user;
}

export async function updateUserProfile(
  userId: number,
  input: { fullName: string; phone: string | null },
): Promise<void> {
  await db.update(users).set(input).where(eq(users.id, userId));
}

export async function updateUserPassword(
  userId: number,
  passwordHash: string,
): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function setUserActive(
  userId: number,
  isActive: boolean,
): Promise<void> {
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

export async function setUserRole(userId: number, role: Role): Promise<void> {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getActiveAdminIds(): Promise<number[]> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.isActive, true)));
  return rows.map((row) => row.id);
}

export type UserListItem = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  reportCount: number;
};

export async function listUsersPage(options: {
  page: number;
  query?: string;
}): Promise<{ rows: UserListItem[]; total: number; pageCount: number }> {
  const { page, query } = options;
  // SQLite LIKE is case-insensitive for ASCII, which covers the seeded data.
  const where = query
    ? or(
        like(users.fullName, `%${query}%`),
        like(users.email, `%${query}%`),
      )
    : undefined;

  const rows = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      reportCount: sql<number>`(SELECT COUNT(*) FROM ${reports} WHERE ${reports.userId} = ${users.id})`,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(USERS_PAGE_SIZE)
    .offset((page - 1) * USERS_PAGE_SIZE);

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(where);

  return {
    rows,
    total,
    pageCount: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
  };
}
