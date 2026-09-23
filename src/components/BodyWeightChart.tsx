"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { useT } from "@/i18n/client";

export function BodyWeightChart({ data }: { data: { date: string; weight: number }[] }) {
  const t = useT();

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bwFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--arc-days)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--arc-days)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "currentColor", opacity: 0.45 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: "currentColor", opacity: 0.45 }} tickLine={false} axisLine={false} width={38} tickCount={3} domain={["auto", "auto"]} />
          <Tooltip
            formatter={(v) => [`${v} ${t.perfil.peso.kg}`, t.perfil.peso.serie]}
            contentStyle={{
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 12,
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          />
          <Area type="monotone" dataKey="weight" stroke="var(--arc-days)" strokeWidth={3} strokeLinecap="round" fill="url(#bwFill)" dot={{ r: 3, fill: "var(--arc-days)", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
