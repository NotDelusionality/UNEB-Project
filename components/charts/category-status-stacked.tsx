"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  REPORT_STATUSES,
  STATUS_META,
  type ReportStatus,
} from "@/lib/constants";

export type CategoryStatusDatum = { label: string } & Record<
  ReportStatus,
  number
>;

/** Category × status — stacked bars in the status hues (§12.5). */
export function CategoryStatusStacked({
  data,
}: {
  data: CategoryStatusDatum[];
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
        >
          <CartesianGrid stroke="#E4DED4" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            interval={0}
            angle={-30}
            textAnchor="end"
            height={64}
            tick={{ fontSize: 11, fill: "#57534E" }}
            tickLine={false}
            axisLine={{ stroke: "#E4DED4" }}
          />
          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 11,
              fill: "#57534E",
              fontFamily: "var(--font-roboto-mono)",
            }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "#EAE4DB" }}
            contentStyle={{
              backgroundColor: "#FBFAF7",
              borderColor: "#E4DED4",
              borderRadius: 6,
              fontSize: 13,
              fontFamily: "var(--font-roboto-mono)",
            }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
          {REPORT_STATUSES.map((status) => (
            <Bar
              key={status}
              dataKey={status}
              name={STATUS_META[status].label}
              stackId="status"
              fill={STATUS_META[status].hex}
              maxBarSize={36}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
