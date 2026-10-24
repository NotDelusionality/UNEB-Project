"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendLineDatum = { label: string; count: number };

/** Submissions over the last 30 days, zero-filled server-side (§7.3). */
export function TrendLine({ data }: { data: TrendLineDatum[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#E4DED4" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{
              fontSize: 11,
              fill: "#57534E",
              fontFamily: "var(--font-roboto-mono)",
            }}
            tickLine={false}
            axisLine={{ stroke: "#E4DED4" }}
            interval={4}
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
            contentStyle={{
              backgroundColor: "#FBFAF7",
              borderColor: "#E4DED4",
              borderRadius: 6,
              fontSize: 13,
              fontFamily: "var(--font-roboto-mono)",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Reports"
            stroke="#B8401C"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
