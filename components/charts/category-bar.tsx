"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_RAMP } from "@/lib/constants";

export type CategoryBarDatum = { label: string; count: number };

/** Reports by category — horizontal bars in the warm rust ramp (§12.5). */
export function CategoryBar({ data }: { data: CategoryBarDatum[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="#E4DED4" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{
              fontSize: 11,
              fill: "#57534E",
              fontFamily: "var(--font-roboto-mono)",
            }}
            tickLine={false}
            axisLine={{ stroke: "#E4DED4" }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={100}
            tick={{ fontSize: 12, fill: "#57534E" }}
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
          <Bar
            dataKey="count"
            name="Reports"
            radius={[0, 4, 4, 0]}
            barSize={18}
            isAnimationActive={false}
          >
            {data.map((datum, index) => (
              <Cell
                key={datum.label}
                fill={CHART_RAMP[index % CHART_RAMP.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
