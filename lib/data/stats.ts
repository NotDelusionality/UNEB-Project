import { and, count, desc, eq, gte, inArray, min, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  meetings,
  reports,
  reportStatusHistory,
  users,
  type Report,
} from "@/db/schema";
import {
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  type ReportCategory,
  type ReportStatus,
} from "@/lib/constants";

/** Counter strip on the public home page (§7.1). */
export async function publicHomeCounts(): Promise<{
  totalReports: number;
  resolvedReports: number;
  upcomingMeetings: number;
}> {
  const [[{ total }], [{ resolved }], [{ upcoming }]] = await Promise.all([
    db.select({ total: count() }).from(reports),
    db
      .select({ resolved: count() })
      .from(reports)
      .where(eq(reports.status, "resolved")),
    db
      .select({ upcoming: count() })
      .from(meetings)
      .where(gte(meetings.meetingDate, new Date())),
  ]);
  return {
    totalReports: total,
    resolvedReports: resolved,
    upcomingMeetings: upcoming,
  };
}

export type TrendPoint = { day: string; label: string; count: number };

/**
 * Submissions per day over the last 30 days, missing days filled with zero
 * (§7.3). Days are UTC, matching how timestamps are stored.
 */
export async function submissionTrend30(): Promise<TrendPoint[]> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 29);

  const rows = await db
    .select({
      day: sql<string>`date(${reports.createdAt}, 'unixepoch')`,
      n: count(),
    })
    .from(reports)
    .where(gte(reports.createdAt, start))
    .groupBy(sql`date(${reports.createdAt}, 'unixepoch')`);

  const byDay = new Map(rows.map((row) => [row.day, row.n]));
  const labelFormat = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  const points: TrendPoint[] = [];
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    const day = date.toISOString().slice(0, 10);
    points.push({
      day,
      label: labelFormat.format(date),
      count: byDay.get(day) ?? 0,
    });
  }
  return points;
}

export type StatusCount = { status: ReportStatus; count: number };

export async function reportCountsByStatus(): Promise<StatusCount[]> {
  const rows = await db
    .select({ status: reports.status, n: count() })
    .from(reports)
    .groupBy(reports.status);
  const byStatus = new Map(rows.map((row) => [row.status, row.n]));
  return REPORT_STATUSES.map((status) => ({
    status,
    count: byStatus.get(status) ?? 0,
  }));
}

export async function adminDashboardStats(): Promise<{
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  activeUsers: number;
  upcomingMeetings: number;
  byStatus: StatusCount[];
  trend: TrendPoint[];
  recent: (Report & { reporterName: string })[];
}> {
  const [byStatus, trend, [{ activeUsers }], [{ upcoming }], recentRows] =
    await Promise.all([
      reportCountsByStatus(),
      submissionTrend30(),
      db
        .select({ activeUsers: count() })
        .from(users)
        .where(eq(users.isActive, true)),
      db
        .select({ upcoming: count() })
        .from(meetings)
        .where(gte(meetings.meetingDate, new Date())),
      db
        .select({ report: reports, reporterName: users.fullName })
        .from(reports)
        .innerJoin(users, eq(users.id, reports.userId))
        .orderBy(desc(reports.createdAt), desc(reports.id))
        .limit(5),
    ]);

  const totals = new Map(byStatus.map((row) => [row.status, row.count]));
  return {
    totalReports: byStatus.reduce((sum, row) => sum + row.count, 0),
    pendingReports: totals.get("pending") ?? 0,
    resolvedReports: totals.get("resolved") ?? 0,
    activeUsers,
    upcomingMeetings: upcoming,
    byStatus,
    trend,
    recent: recentRows.map((row) => ({
      ...row.report,
      reporterName: row.reporterName,
    })),
  };
}

export type CategoryCount = { category: ReportCategory; count: number };

export async function reportCountsByCategory(): Promise<CategoryCount[]> {
  const rows = await db
    .select({ category: reports.category, n: count() })
    .from(reports)
    .groupBy(reports.category);
  const byCategory = new Map(rows.map((row) => [row.category, row.n]));
  return REPORT_CATEGORIES.map((category) => ({
    category,
    count: byCategory.get(category) ?? 0,
  }));
}

export type CategoryStatusRow = { category: ReportCategory } & Record<
  ReportStatus,
  number
>;

export async function reportCountsByCategoryAndStatus(): Promise<
  CategoryStatusRow[]
> {
  const rows = await db
    .select({ category: reports.category, status: reports.status, n: count() })
    .from(reports)
    .groupBy(reports.category, reports.status);

  return REPORT_CATEGORIES.map((category) => {
    const entry = Object.fromEntries(
      REPORT_STATUSES.map((status) => [status, 0]),
    ) as Record<ReportStatus, number>;
    for (const row of rows) {
      if (row.category === category) entry[row.status] = row.n;
    }
    return { category, ...entry };
  });
}

/**
 * Average interval from creation to the first transition into `resolved`,
 * over reports now resolved or closed (§7.3 Analytics).
 */
export async function averageResolutionDays(): Promise<{
  days: number | null;
  cohortSize: number;
}> {
  const rows = await db
    .select({
      createdAt: reports.createdAt,
      resolvedAtSeconds: min(reportStatusHistory.createdAt),
    })
    .from(reports)
    .innerJoin(
      reportStatusHistory,
      and(
        eq(reportStatusHistory.reportId, reports.id),
        eq(reportStatusHistory.toStatus, "resolved"),
      ),
    )
    .where(inArray(reports.status, ["resolved", "closed"]))
    .groupBy(reports.id);

  if (rows.length === 0) return { days: null, cohortSize: 0 };

  const totalDays = rows.reduce((sum, row) => {
    const resolvedMs =
      row.resolvedAtSeconds instanceof Date
        ? row.resolvedAtSeconds.getTime()
        : Number(row.resolvedAtSeconds) * 1000;
    return sum + (resolvedMs - row.createdAt.getTime()) / 86_400_000;
  }, 0);

  return {
    days: Math.round((totalDays / rows.length) * 10) / 10,
    cohortSize: rows.length,
  };
}

export type LocationCount = { location: string; count: number };

export async function topLocations(limit: number): Promise<LocationCount[]> {
  const rows = await db
    .select({ location: reports.location, n: count() })
    .from(reports)
    .groupBy(reports.location)
    .orderBy(desc(count()), reports.location)
    .limit(limit);
  return rows.map((row) => ({ location: row.location, count: row.n }));
}
