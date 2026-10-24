import type { Metadata } from "next";
import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { MeetingForm } from "@/components/forms/meeting-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteMeeting } from "@/lib/actions/meetings";
import { requireAdmin } from "@/lib/auth";
import { pastMeetings, upcomingMeetings } from "@/lib/data/meetings";
import { formatDateTime } from "@/lib/format";
import type { Meeting } from "@/db/schema";

export const metadata: Metadata = { title: "Meetings" };

function AdminMeetingList({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="space-y-4">
      {meetings.map((meeting) => (
        <Card key={meeting.id} className="max-w-3xl py-5">
          <CardContent className="flex items-start justify-between gap-3 px-5">
            <div>
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
            </div>
            <ConfirmAction
              title="Delete meeting"
              description={`This removes “${meeting.title}” from every portal. This cannot be undone.`}
              confirmLabel="Delete"
              destructive
              action={deleteMeeting.bind(null, meeting.id)}
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted hover:text-destructive"
                  aria-label={`Delete meeting: ${meeting.title}`}
                >
                  <Trash2 aria-hidden />
                </Button>
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function AdminMeetingsPage() {
  await requireAdmin();
  const [upcoming, past] = await Promise.all([
    upcomingMeetings(),
    pastMeetings(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        description="Local council meetings shown in every member's portal."
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Schedule meeting
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingForm />
        </CardContent>
      </Card>

      <section aria-labelledby="upcoming-meetings" className="space-y-4">
        <h3
          id="upcoming-meetings"
          className="font-display text-lg font-bold text-ink"
        >
          Upcoming
        </h3>
        {upcoming.length === 0 ? (
          <EmptyState message="No upcoming meetings. Schedule one above." />
        ) : (
          <AdminMeetingList meetings={upcoming} />
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-meetings" className="space-y-4">
          <h3
            id="past-meetings"
            className="font-display text-lg font-bold text-ink"
          >
            Past
          </h3>
          <AdminMeetingList meetings={past} />
        </section>
      )}
    </div>
  );
}
