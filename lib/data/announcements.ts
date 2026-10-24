import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { announcements, type Announcement } from "@/db/schema";

export async function listAnnouncements(): Promise<Announcement[]> {
  return db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt), desc(announcements.id));
}

export async function latestAnnouncements(
  limit: number,
): Promise<Announcement[]> {
  return db
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt), desc(announcements.id))
    .limit(limit);
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  authorId: number;
}): Promise<void> {
  await db.insert(announcements).values(input);
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await db.delete(announcements).where(eq(announcements.id, id));
}
