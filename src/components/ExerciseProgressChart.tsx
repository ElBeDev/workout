"use client";

import { useState } from "react";
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
  maxPlates: number | null;
  maxReps: number | null;
  volume: number | null;
};

export type Metric = "maxWeight" | "maxPlates" | "maxReps" | "volume";

const ALL_METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: "maxWeight", label: "Peso máx.", unit: "kg" },
  { key: "maxPlates", label: "Placas máx.", unit: "placas" },
  { key: "maxReps", label: "Reps máx.", unit: "reps" },
  { key: "volume", label: "Volumen", unit: "kg" },
];

export function ExerciseProgressChart({
  data,
  defaultMetric = "maxWeight",
}: {
  data: ProgressPoint[];
  defaultMetric?: Metric;
}) {
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  // Only offer the toggles that have data (plates vs kg are exclusive in practice).
  const METRICS = ALL_METRICS.filter(
    (m) => m.key === metric || data.some((d) => d[m.key] !== null)
  );
  const meta = ALL_METRICS.find((m) => m.key === metric)!;
  const hasAny = data.some((d) => d[metric] !== null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-full bg-surface-2 p-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={`flex-1 rounded-full py-1.5 text-[12px] font-semibold transition ${
              metric === m.key ? "bg-primary text-primary-foreground" : "text-muted"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="h-56 w-full">
        {hasAny ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c6cf0" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7c6cf0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="currentColor" opacity={0.06} vertical={false} />
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
                width={44}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(v) => [`${v} ${meta.unit}`, meta.label]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 24px rgba(21,21,31,0.12)",
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#7c6cf0"
                strokeWidth={2.5}
                fill="url(#progressFill)"
                dot={{ r: 3.5, fill: "#7c6cf0", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted">
            Sin datos de {meta.label.toLowerCase()} todavía.
          </p>
        )}
      </div>
    </div>
  );
}
