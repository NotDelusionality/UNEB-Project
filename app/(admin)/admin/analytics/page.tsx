import type { Metadata } from "next";
import {
  CategoryBar,
  type CategoryBarDatum,
} from "@/components/charts/category-bar";
import {
  CategoryStatusStacked,
  type CategoryStatusDatum,
} from "@/components/charts/category-status-stacked";
import { TrendLine } from "@/components/charts/trend-line";
import { PageHeader } from "@/components/page-header";
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
import { CATEGORY_META } from "@/lib/constants";
import {
  averageResolutionDays,
  reportCountsByCategory,
  reportCountsByCategoryAndStatus,
  submissionTrend30,
  topLocations,
} from "@/lib/data/stats";

export const metadata: Metadata = { title: "Analytics" };

// Chart and table cards fade in as they arrive; the charts inside keep their
// own animation off (motion §1, §5).
const CARD_ENTER =
  "animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]";
const CARD_FADE =
  "animate-in fade-in fill-mode-both duration-[var(--dur-slow)] ease-[var(--ease-out)]";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const [byCategory, byCategoryStatus, trend, resolution, locations] =
    await Promise.all([
      reportCountsByCategory(),
      reportCountsByCategoryAndStatus(),
      submissionTrend30(),
      averageResolutionDays(),
      topLocations(5),
    ]);

  const categoryData: CategoryBarDatum[] = byCategory.map((entry) => ({
    label: CATEGORY_META[entry.category].label,
    count: entry.count,
  }));

  const stackedData: CategoryStatusDatum[] = byCategoryStatus.map(
    ({ category, ...counts }) => ({
      label: CATEGORY_META[category].label,
      ...counts,
    }),
  );

  const trendData = trend.map((point) => ({
    label: point.label,
    count: point.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="How reports are distributed and how quickly they are resolved."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={CARD_ENTER}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Reports by category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBar data={categoryData} />
          </CardContent>
        </Card>

        <Card className={CARD_ENTER} style={{ animationDelay: "80ms" }}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Category by status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryStatusStacked data={stackedData} />
          </CardContent>
        </Card>
      </div>

      <Card className={CARD_ENTER} style={{ animationDelay: "160ms" }}>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Submissions, last 30 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLine data={trendData} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={CARD_ENTER} style={{ animationDelay: "240ms" }}>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Average resolution time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolution.days === null ? (
              <p className="py-6 text-[13px] text-muted">
                No resolved reports yet. The figure appears once the first
                report reaches Resolved.
              </p>
            ) : (
              <div className="py-2">
                <p className="font-mono text-3xl font-medium tabular-nums text-ink">
                  {resolution.days}{" "}
                  <span className="font-sans text-lg font-semibold text-muted">
                    days
                  </span>
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  From submission to the first transition into Resolved, over{" "}
                  {resolution.cohortSize} resolved{" "}
                  {resolution.cohortSize === 1 ? "report" : "reports"}.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`py-0 ${CARD_FADE}`} style={{ animationDelay: "300ms" }}>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold">
              Top locations
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {locations.length === 0 ? (
              <p className="px-6 pb-6 text-[13px] text-muted">
                No reports yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Location</TableHead>
                    <TableHead className="pr-6 text-right">Reports</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.location}>
                      <TableCell className="pl-6 font-medium text-ink">
                        {location.location}
                      </TableCell>
                      <TableCell className="pr-6 text-right tabular-nums text-muted">
                        {location.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
