"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export type ProgressPoint = {
  date: string;
  maxWeight: number | null;
  maxPlates: number | null;
  maxReps: number | null;
  volume: number | null;
  est1RM: number | null;
};

export type Metric = "maxWeight" | "maxPlates" | "maxReps" | "volume" | "est1RM";

export function ExerciseProgressChart({
  data,
  defaultMetric = "maxWeight",
  weightUnit = "kg",
}: {
  data: ProgressPoint[];
  defaultMetric?: Metric;
  weightUnit?: "kg" | "lbs";
}) {
  const t = useT();
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  const weightUnitLabel = weightUnit === "lbs" ? "lb" : "kg";
  const ALL_METRICS: { key: Metric; label: string; unit: string }[] = [
    { key: "maxWeight", label: t.progreso.metricaPesoMax, unit: weightUnitLabel },
    { key: "maxPlates", label: t.progreso.metricaPlacasMax, unit: t.progreso.unidadPlacas },
    { key: "maxReps", label: t.progreso.metricaRepsMax, unit: t.progreso.unidadReps },
    // Volume is always summed in kg (see progreso/[exerciseId]/page.tsx) so
    // it stays a coherent number even for exercises tracked in lb.
    { key: "volume", label: t.progreso.metricaVolumen, unit: "kg" },
    { key: "est1RM", label: t.progreso.metrica1RM, unit: weightUnitLabel },
  ];
  // Only offer the toggles that have data (plates vs kg are exclusive in practice).
  const METRICS = ALL_METRICS.filter(
    (m) => m.key === metric || data.some((d) => d[m.key] !== null)
  );
  const meta = ALL_METRICS.find((m) => m.key === metric)!;
  const hasAny = data.some((d) => d[metric] !== null);
  // El color dice de qué dato se trata, igual que en los anillos.
  const color =
    metric === "maxReps"
      ? "var(--arc-sets)"
      : metric === "maxPlates"
        ? "var(--arc-days)"
        : "var(--arc-load)";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-full bg-surface-2 p-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={`flex-1 rounded-full py-1.5 text-[12px] font-semibold transition ${
              metric === m.key ? "bg-surface text-foreground shadow-hero" : "text-muted"
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
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.45 }}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "currentColor", opacity: 0.45 }}
                tickLine={false}
                axisLine={false}
                width={40}
                tickCount={3}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(v) => [`${v} ${meta.unit}`, meta.label]}
                cursor={{ stroke: "currentColor", strokeOpacity: 0.15 }}
                contentStyle={{
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 12,
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                fill="url(#progressFill)"
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5.5 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-muted">
            {t.progreso.graficaSinDatos(meta.label)}
          </p>
        )}
      </div>
    </div>
  );
}
