import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { listAnnouncements } from "@/lib/data/announcements";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  await requireUser();
  const announcements = await listAnnouncements();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Notices published by the school administration."
      />

      {announcements.length === 0 ? (
        <EmptyState message="No announcements yet. When the administration publishes one, it appears here." />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="max-w-3xl">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  {announcement.title}
                </CardTitle>
                <p className="text-[13px] text-muted">
                  {formatDate(announcement.createdAt)}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line text-ink">
                  {announcement.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
