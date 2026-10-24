import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { CaseNumber } from "@/components/case-number";
import { CategoryLabel } from "@/components/category-label";
import { ConfirmAction } from "@/components/confirm-action";
import { CommentForm } from "@/components/forms/comment-form";
import { CommentThread } from "@/components/reports/comment-thread";
import { StatusTimeline } from "@/components/reports/status-timeline";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteReport } from "@/lib/actions/reports";
import { requireUser } from "@/lib/auth";
import {
  getReportComments,
  getReportForViewer,
  getReportHistory,
} from "@/lib/data/reports";
import { caseNumber, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Report detail" };

export default async function MemberReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireUser();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // A report the viewer may not see renders not-found, so the response does
  // not confirm the resource exists (§10, §11).
  const report = await getReportForViewer(id, user);
  if (!report) notFound();

  const [comments, history] = await Promise.all([
    getReportComments(id),
    getReportHistory(id),
  ]);
  const isClosed = report.status === "closed";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <CaseNumber id={report.id} className="text-lg" />
          <StatusBadge status={report.status} />
        </div>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">
          {report.title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
          <CategoryLabel category={report.category} />
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            {report.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden />
            Submitted {formatDateTime(report.createdAt)}
          </span>
          <span>Updated {formatDateTime(report.updatedAt)}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink">
                {report.description}
              </p>
              {report.imagePath && (
                <figure>
                  {/* Plain <img>: the src is the authenticated route handler (§3.4, §9). */}
                  <img
                    src={`/uploads/${report.imagePath}`}
                    alt={`Photo attached to report ${caseNumber(report.id)}`}
                    className="max-h-96 w-auto max-w-full rounded-lg border border-line"
                  />
                </figure>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <CommentThread comments={comments} />
              {isClosed ? (
                <p className="rounded-md border border-line bg-canvas px-3.5 py-2.5 text-[13px] text-muted">
                  This case is closed and no longer accepts comments.
                </p>
              ) : (
                <CommentForm reportId={report.id} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Status timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline
                submittedBy={report.authorName}
                submittedAt={report.createdAt}
                entries={history}
              />
            </CardContent>
          </Card>

          {report.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Delete report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[13px] text-muted">
                  A report can be deleted while it is still pending. Once the
                  administration starts reviewing it, it stays on record.
                </p>
                <ConfirmAction
                  title="Delete report"
                  description={`This permanently removes report ${caseNumber(report.id)} together with its messages and history. This cannot be undone.`}
                  confirmLabel="Delete report"
                  destructive
                  action={deleteReport.bind(null, report.id)}
                  trigger={
                    <Button
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                    >
                      Delete report
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
