"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export type StatusDonutDatum = { name: string; value: number; color: string };

/** Reports by status; slices use the badge hues (§12.5). */
export function StatusDonut({ data }: { data: StatusDonutDatum[] }) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  if (total === 0) {
    return (
      <p className="flex h-64 items-center justify-center text-[13px] text-muted">
        No reports yet.
      </p>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="#FBFAF7"
            isAnimationActive={false}
          >
            {data.map((datum) => (
              <Cell key={datum.name} fill={datum.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FBFAF7",
              borderColor: "#E4DED4",
              borderRadius: 6,
              fontSize: 13,
              fontFamily: "var(--font-roboto-mono)",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 13 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
