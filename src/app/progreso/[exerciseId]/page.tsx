import { db } from "@/db";
import { setLogs, workoutSessions, exercises } from "@/db/schema";
import { pickGif } from "@/db/exercise-gif";
import { requireUserId } from "@/lib/session";
import { and, eq, asc, isNull, or } from "drizzle-orm";
import { fmtDate } from "@/lib/dates";
import { toKg, type WeightUnit } from "@/lib/suggest";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { bodyPartLabel } from "@/lib/body-parts";
import { getDict } from "@/i18n";
import { Card, GroupedList, PageHeader } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ExerciseProgressChart, type Metric } from "@/components/ExerciseProgressChart";

export const dynamic = "force-dynamic";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const userId = await requireUserId();
  const t = await getDict();

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), or(isNull(exercises.userId), eq(exercises.userId, userId))));
  if (!exercise) notFound();

  const sets = await db
    .select({
      sessionId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      weight: setLogs.weight,
      weightUnit: setLogs.weightUnit,
      plates: setLogs.plates,
      reps: setLogs.reps,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(setLogs.exerciseId, exerciseId),
        eq(workoutSessions.userId, userId),
        eq(setLogs.completed, true)
      )
    )
    .orderBy(asc(workoutSessions.startedAt));

  type Row = {
    sessionId: string;
    startedAt: Date;
    maxWeight: number | null;
    weightUnit: WeightUnit | null;
    maxPlates: number | null;
    maxReps: number | null;
    volume: number | null;
    sets: number;
  };
  const rows: Row[] = [];
  for (const s of sets) {
    let r = rows.find((x) => x.sessionId === s.sessionId);
    if (!r) {
      r = {
        sessionId: s.sessionId,
        startedAt: s.startedAt,
        maxWeight: null,
        weightUnit: null,
        maxPlates: null,
        maxReps: null,
        volume: null,
        sets: 0,
      };
      rows.push(r);
    }
    const unit: WeightUnit = s.weightUnit === "lbs" ? "lbs" : "kg";
    const w = s.weight ? Number(s.weight) : null;
    const reps = s.reps ?? null;
    if (s.plates !== null && s.plates > 0) r.maxPlates = Math.max(r.maxPlates ?? 0, s.plates);
    if (w !== null && (r.maxWeight === null || w > r.maxWeight)) {
      r.maxWeight = w;
      r.weightUnit = unit;
    }
    if (reps !== null) r.maxReps = Math.max(r.maxReps ?? 0, reps);
    // Volume always sums in kg so a session that mixes kg- and lb-tracked
    // sets for this exercise still adds up to one coherent number.
    if (w !== null && reps !== null) r.volume = (r.volume ?? 0) + toKg(w, unit) * reps;
    r.sets += 1;
  }

  const chartData = rows.map((r) => ({
    date: fmtDate(r.startedAt, { day: "2-digit", month: "short" }, t.comun.intl),
    maxWeight: r.maxWeight,
    maxPlates: r.maxPlates,
    maxReps: r.maxReps,
    volume: r.volume !== null ? Math.round(r.volume) : null,
  }));

  const anyWeight = rows.some((r) => r.maxWeight !== null);
  const anyPlates = !anyWeight && rows.some((r) => r.maxPlates !== null);
  const defaultMetric: Metric = anyWeight ? "maxWeight" : anyPlates ? "maxPlates" : "maxReps";
  // Represent the whole page with whichever unit was used most recently —
  // an exercise rarely switches equipment/unit from one session to the next.
  const weightUnit: WeightUnit =
    [...rows].reverse().find((r) => r.weightUnit !== null)?.weightUnit ?? "kg";
  const unit = anyWeight
    ? weightUnit === "lbs"
      ? "lb"
      : "kg"
    : anyPlates
      ? t.progreso.unidadPlacas
      : t.progreso.unidadReps;
  const pick = (r: Row) => (anyWeight ? r.maxWeight : anyPlates ? r.maxPlates : r.maxReps);
  const best = rows.reduce<number | null>((acc, r) => {
    const v = pick(r);
    if (v === null) return acc;
    return acc === null ? v : Math.max(acc, v);
  }, null);
  const latest = rows.length ? pick(rows[rows.length - 1]) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={exercise.nameEs ?? exercise.name}
        backHref="/progreso"
        subtitle={[bodyPartLabel(exercise.bodyPart), exercise.nameEs ? exercise.name : null]
          .filter(Boolean)
          .join(" · ")}
        capitalize
      />

      <Card hero className="flex items-center gap-3 p-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
          <ExerciseThumb src={pickGif(exercise)} alt={exercise.nameEs ?? exercise.name} className="h-full w-full" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 pl-1">
          <div>
            <p className="label flex items-center gap-1 text-load">
              <Trophy className="h-3 w-3" /> {t.progreso.record}
            </p>
            <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums">
              {best !== null ? `${best}` : "—"}
              <span className="ml-1 text-[13px] font-semibold text-muted">{unit}</span>
            </p>
          </div>
          <div>
            <p className="label text-muted">{t.progreso.ultima}</p>
            <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums">
              {latest !== null ? `${latest}` : "—"}
              <span className="ml-1 text-[13px] font-semibold text-muted">{unit}</span>
            </p>
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">{t.progreso.ejercicioSinSesiones}</p>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <p className="label mb-3 text-muted">{t.progreso.porSesion}</p>
            <ExerciseProgressChart data={chartData} defaultMetric={defaultMetric} weightUnit={weightUnit} />
          </Card>

          <GroupedList>
            {[...rows].reverse().map((r) => (
              <Link
                key={r.sessionId}
                href={`/progreso/sesion/${r.sessionId}`}
                className="flex items-center justify-between px-4 py-3.5 text-[15px] transition active:bg-surface-2"
              >
                    <span className="text-muted">
                      {fmtDate(r.startedAt, { dateStyle: "medium" }, t.comun.intl)}
                    </span>
                    <span className="flex items-center gap-3 tabular-nums">
                      <span className="text-muted">{t.progreso.series(r.sets)}</span>
                      <span className="font-semibold">
                        {r.maxWeight !== null
                          ? `${r.maxWeight} ${r.weightUnit === "lbs" ? "lb" : "kg"}`
                          : r.maxPlates !== null
                            ? t.progreso.placas(r.maxPlates)
                            : r.maxReps !== null
                              ? t.progreso.reps(r.maxReps)
                              : "—"}
                      </span>
                    </span>
              </Link>
            ))}
          </GroupedList>
        </>
      )}
    </div>
  );
}
