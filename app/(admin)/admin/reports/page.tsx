import type { Metadata } from "next";
import Link from "next/link";
import { CaseNumber } from "@/components/case-number";
import { CategoryLabel } from "@/components/category-label";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
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
import { requireAdmin } from "@/lib/auth";
import {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportStatus,
} from "@/lib/constants";
import { listReportsAdmin } from "@/lib/data/reports";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    category?: string;
    sort?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() || undefined;
  const status = (REPORT_STATUSES as readonly string[]).includes(
    params.status ?? "",
  )
    ? (params.status as ReportStatus)
    : undefined;
  const category = (REPORT_CATEGORIES as readonly string[]).includes(
    params.category ?? "",
  )
    ? (params.category as ReportCategory)
    : undefined;
  const sort = params.sort === "oldest" ? "oldest" : "newest";

  const { rows, total, pageCount } = await listReportsAdmin({
    page,
    query,
    status,
    category,
    sort,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Every report in the register. Open a case to triage it."
      />

      <ReportFilters
        searchPlaceholder="Search title or location"
        showCategory
        showSort
      />

      {rows.length === 0 ? (
        <EmptyState
          message="No reports match these filters. Clear them to see the full register."
          action={
            <Button variant="outline" asChild>
              <Link href="/admin/reports">Clear filters</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* The table fades in as a whole rather than row by row, so paging
              through the register never replays a per-row cascade (motion §5). */}
          <Card className="py-0 animate-in fade-in fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Case</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((report) => (
                    <TableRow key={report.id} className="relative">
                      <TableCell className="pl-4">
                        <CaseNumber id={report.id} className="text-[13px]" />
                      </TableCell>
                      <TableCell className="max-w-72">
                        {/* The pseudo-element stretches this link across the
                            whole row, so a row click opens the case. */}
                        <Link
                          href={`/admin/reports/${report.id}`}
                          className="block truncate font-medium text-ink outline-none after:absolute after:inset-0 hover:underline focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
                        >
                          {report.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-[13px] text-muted">
                        {report.reporterName}
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

          <Pagination
            page={page}
            pageCount={pageCount}
            total={total}
            basePath="/admin/reports"
            searchParams={{
              q: query,
              status,
              category,
              sort: sort === "oldest" ? "oldest" : undefined,
            }}
          />
        </>
      )}
    </div>
  );
}
