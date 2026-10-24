import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Users,
} from "lucide-react";
import { CaseNumber } from "@/components/case-number";
import {
  StatusDonut,
  type StatusDonutDatum,
} from "@/components/charts/status-donut";
import { TrendLine } from "@/components/charts/trend-line";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { STATUS_META } from "@/lib/constants";
import { adminDashboardStats } from "@/lib/data/stats";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await adminDashboardStats();

  const donutData: StatusDonutDatum[] = stats.byStatus.map((entry) => ({
    name: STATUS_META[entry.status].label,
    value: entry.count,
    color: STATUS_META[entry.status].hex,
  }));

  const trendData = stats.trend.map((point) => ({
    label: point.label,
    count: point.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="The state of the register at a glance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total reports"
          value={stats.totalReports}
          icon={FileText}
          index={0}
        />
        <StatCard
          label="Pending"
          value={stats.pendingReports}
          icon={Clock3}
          index={1}
        />
        <StatCard
          label="Resolved"
          value={stats.resolvedReports}
          icon={CheckCircle2}
          index={2}
        />
        <StatCard
          label="Active users"
          value={stats.activeUsers}
          icon={Users}
          index={3}
        />
        <StatCard
          label="Upcoming meetings"
          value={stats.upcomingMeetings}
          icon={CalendarDays}
          index={4}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Charts participate in the motion system only through their card,
            which fades in as it arrives; the chart inside keeps its own
            animation switched off (motion §1, §5). */}
        <Card
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]"
          style={{ animationDelay: "150ms" }}
        >
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Reports by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={donutData} />
          </CardContent>
        </Card>
        <Card
          className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]"
          style={{ animationDelay: "220ms" }}
        >
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Submissions, last 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendLine data={trendData} />
          </CardContent>
        </Card>
      </div>

      {/* Dense tables fade in as a whole, never row by row (motion §5). */}
      <Card
        className="py-0 animate-in fade-in fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]"
        style={{ animationDelay: "300ms" }}
      >
        <CardHeader className="flex-row items-center justify-between py-4">
          <CardTitle className="text-sm font-semibold">
            Most recent reports
          </CardTitle>
          <Button variant="link" size="sm" asChild>
            <Link href="/admin/reports">Manage reports</Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Case</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recent.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="pl-4">
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className="hover:underline"
                    >
                      <CaseNumber id={report.id} className="text-[13px]" />
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-72">
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className="block truncate font-medium text-ink hover:underline"
                    >
                      {report.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-[13px] text-muted">
                    {report.reporterName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status} />
                  </TableCell>
                  <TableCell className="pr-4 text-[13px] text-muted">
                    {formatDate(report.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
