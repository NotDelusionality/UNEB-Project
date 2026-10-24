import { asc, count, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { meetings, type Meeting } from "@/db/schema";

export async function upcomingMeetings(limit?: number): Promise<Meeting[]> {
  const query = db
    .select()
    .from(meetings)
    .where(gte(meetings.meetingDate, new Date()))
    .orderBy(asc(meetings.meetingDate), asc(meetings.id));
  return limit ? query.limit(limit) : query;
}

export async function pastMeetings(): Promise<Meeting[]> {
  return db
    .select()
    .from(meetings)
    .where(lt(meetings.meetingDate, new Date()))
    .orderBy(desc(meetings.meetingDate), desc(meetings.id));
}

export async function countUpcomingMeetings(): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(meetings)
    .where(gte(meetings.meetingDate, new Date()));
  return n;
}

export async function createMeeting(input: {
  title: string;
  venue: string;
  description: string | null;
  meetingDate: Date;
  authorId: number;
}): Promise<void> {
  await db.insert(meetings).values(input);
}

export async function deleteMeeting(id: number): Promise<void> {
  await db.delete(meetings).where(eq(meetings.id, id));
}
