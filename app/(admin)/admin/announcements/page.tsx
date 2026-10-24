import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { AnnouncementForm } from "@/components/forms/announcement-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteAnnouncement } from "@/lib/actions/announcements";
import { requireAdmin } from "@/lib/auth";
import { listAnnouncements } from "@/lib/data/announcements";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminAnnouncementsPage() {
  await requireAdmin();
  const announcements = await listAnnouncements();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Notices published to every member's portal."
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Publish announcement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>

      {announcements.length === 0 ? (
        <EmptyState message="No announcements yet. Publish one above and it appears in every member's portal." />
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="max-w-3xl">
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {announcement.title}
                  </CardTitle>
                  <p className="mt-1 text-[13px] text-muted">
                    {formatDate(announcement.createdAt)}
                  </p>
                </div>
                <ConfirmAction
                  title="Delete announcement"
                  description={`This removes “${announcement.title}” from every portal. This cannot be undone.`}
                  confirmLabel="Delete"
                  destructive
                  action={deleteAnnouncement.bind(null, announcement.id)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted hover:text-destructive"
                      aria-label={`Delete announcement: ${announcement.title}`}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  }
                />
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
