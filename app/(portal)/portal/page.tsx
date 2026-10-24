import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
} from "lucide-react";
import { CaseNumber } from "@/components/case-number";
import { EmptyState } from "@/components/empty-state";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { latestAnnouncements } from "@/lib/data/announcements";
import { upcomingMeetings } from "@/lib/data/meetings";
import { recentNotifications } from "@/lib/data/notifications";
import { memberReportStats, recentReportsForUser } from "@/lib/data/reports";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PortalDashboardPage() {
  const { user } = await requireUser();
  const [stats, announcements, meetings, reports, notifications] =
    await Promise.all([
      memberReportStats(user.id),
      latestAnnouncements(3),
      upcomingMeetings(3),
      recentReportsForUser(user.id, 5),
      recentNotifications(user.id, 5),
    ]);
  const hasUnread = notifications.some((notification) => !notification.isRead);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.fullName.split(" ")[0]}`}
        description="Your reports, announcements, and meetings at a glance."
        action={
          <Button asChild>
            <Link href="/portal/reports/new">Submit report</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My reports" value={stats.total} icon={FileText} index={0} />
        <StatCard label="Open" value={stats.open} icon={Clock3} index={1} />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          index={2}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Recent reports
              </CardTitle>
              <Button variant="link" size="sm" asChild>
                <Link href="/portal/reports">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <EmptyState
                  className="border-0 py-8"
                  message="No reports yet. When you submit one, you can track it here."
                  action={
                    <Button asChild>
                      <Link href="/portal/reports/new">Submit report</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <Link
                        href={`/portal/reports/${report.id}`}
                        className="flex items-center gap-4 rounded-md px-1 py-3 transition-colors outline-none hover:bg-canvas focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <CaseNumber id={report.id} className="text-[13px]" />
                        <span className="min-w-0 flex-1 truncate text-sm text-ink">
                          {report.title}
                        </span>
                        <span className="hidden text-[13px] text-muted sm:block">
                          {formatDate(report.createdAt)}
                        </span>
                        <StatusBadge status={report.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Notifications
              </CardTitle>
              <MarkAllReadButton disabled={!hasUnread} />
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted">
                  No notifications yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className="flex items-start gap-3 py-3"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          notification.isRead ? "bg-line" : "bg-primary",
                        )}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            notification.isRead
                              ? "text-muted"
                              : "font-medium text-ink",
                          )}
                        >
                          {notification.reportId ? (
                            <Link
                              href={`/portal/reports/${notification.reportId}`}
                              className="hover:underline"
                            >
                              {notification.message}
                            </Link>
                          ) : (
                            notification.message
                          )}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Latest announcements
              </CardTitle>
              <Button variant="link" size="sm" asChild>
                <Link href="/portal/announcements">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {announcements.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted">
                  No announcements yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {announcements.map((announcement) => (
                    <li key={announcement.id} className="py-3">
                      <Link
                        href="/portal/announcements"
                        className="text-sm font-medium text-ink hover:underline"
                      >
                        {announcement.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDate(announcement.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Next meetings
              </CardTitle>
              <Button variant="link" size="sm" asChild>
                <Link href="/portal/meetings">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted">
                  No upcoming meetings.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {meetings.map((meeting) => (
                    <li key={meeting.id} className="py-3">
                      <p className="text-sm font-medium text-ink">
                        {meeting.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {formatDateTime(meeting.meetingDate)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                        <MapPin className="size-3.5" aria-hidden />
                        {meeting.venue}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
