import type { Metadata } from "next";
import { CalendarDays, ChevronDown, MapPin } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { pastMeetings, upcomingMeetings } from "@/lib/data/meetings";
import { formatDateTime } from "@/lib/format";
import type { Meeting } from "@/db/schema";

export const metadata: Metadata = { title: "Meetings" };

function MeetingList({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="max-w-3xl py-5">
          <CardContent className="px-5">
            <p className="text-sm font-semibold text-ink">{meeting.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4" aria-hidden />
                {formatDateTime(meeting.meetingDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {meeting.venue}
              </span>
            </div>
            {meeting.description && (
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted">
                {meeting.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function MeetingsPage() {
  await requireUser();
  const [upcoming, past] = await Promise.all([
    upcomingMeetings(),
    pastMeetings(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Local council meetings scheduled by the administration."
      />

      {upcoming.length === 0 ? (
        <EmptyState message="No upcoming meetings. When the administration schedules one, it appears here." />
      ) : (
        <MeetingList meetings={upcoming} />
      )}

      {past.length > 0 && (
        <details className="group max-w-3xl">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md text-sm font-medium text-muted outline-none select-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronDown
              className="size-4 transition-transform group-open:rotate-180"
              aria-hidden
            />
            Past meetings ({past.length})
          </summary>
          <div className="mt-4">
            <MeetingList meetings={past} />
          </div>
        </details>
      )}
    </div>
  );
}
