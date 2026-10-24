import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications, type Notification } from "@/db/schema";

export async function unreadNotificationCount(userId: number): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
  return n;
}

export async function recentNotifications(
  userId: number,
  limit: number,
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit);
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
    );
}
