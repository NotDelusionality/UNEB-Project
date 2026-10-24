import type { Metadata } from "next";
import Link from "next/link";
import { CaseNumber } from "@/components/case-number";
import { CategoryLabel } from "@/components/category-label";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ReportFilters } from "@/components/reports/report-filters";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { REPORT_STATUSES, type ReportStatus } from "@/lib/constants";
import { listReportsForUser } from "@/lib/data/reports";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "My reports" };

export default async function MyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { user } = await requireUser();
  const params = await searchParams;

  const status = (REPORT_STATUSES as readonly string[]).includes(
    params.status ?? "",
  )
    ? (params.status as ReportStatus)
    : undefined;
  const query = params.q?.trim() || undefined;
  const hasFilters = Boolean(status || query);

  const reports = await listReportsForUser(user.id, { status, query });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My reports"
        description="Every report you have submitted, with its current status."
        action={
          <Button asChild>
            <Link href="/portal/reports/new">Submit report</Link>
          </Button>
        }
      />

      <ReportFilters searchPlaceholder="Search by title" />

      {reports.length === 0 ? (
        <EmptyState
          message={
            hasFilters
              ? "No reports match these filters. Clear them to see all of your reports."
              : "No reports yet. When you submit one, you can track it here."
          }
          action={
            hasFilters ? (
              <Button variant="outline" asChild>
                <Link href="/portal/reports">Clear filters</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/portal/reports/new">Submit report</Link>
              </Button>
            )
          }
        />
      ) : (
        <Card className="py-0 animate-in fade-in fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Case</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="pl-4">
                      <Link
                        href={`/portal/reports/${report.id}`}
                        className="hover:underline"
                      >
                        <CaseNumber id={report.id} className="text-[13px]" />
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-72">
                      <Link
                        href={`/portal/reports/${report.id}`}
                        className="block truncate font-medium text-ink hover:underline"
                      >
                        {report.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <CategoryLabel
                        category={report.category}
                        className="text-[13px] text-muted"
                      />
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
      )}
    </div>
  );
}
