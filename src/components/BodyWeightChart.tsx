"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export function BodyWeightChart({ data }: { data: { date: string; weight: number }[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bwFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c6cf0" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7c6cf0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} tickLine={false} axisLine={false} width={40} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => [`${v} kg`, "Peso"]}
            contentStyle={{
              fontSize: 12,
              borderRadius: 12,
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          />
          <Area type="monotone" dataKey="weight" stroke="#7c6cf0" strokeWidth={2.5} fill="url(#bwFill)" dot={{ r: 3.5, fill: "#7c6cf0", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
