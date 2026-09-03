"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export type ProgressPoint = {
  date: string;
  maxWeight: number | null;
};

const LINE = "#7c6cf0";

export function ExerciseProgressChart({ data }: { data: ProgressPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE} stopOpacity={0.35} />
              <stop offset="100%" stopColor={LINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="currentColor" opacity={0.08} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip
            cursor={{ stroke: LINE, strokeOpacity: 0.3 }}
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 24px rgba(21,21,31,0.12)",
            }}
            formatter={(value) => [`${value} kg`, "Peso máx."]}
          />
          <Area
            type="monotone"
            dataKey="maxWeight"
            stroke={LINE}
            strokeWidth={2.5}
            fill="url(#progressFill)"
            dot={{ r: 4, fill: LINE, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
