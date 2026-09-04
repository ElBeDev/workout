import { db } from "@/db";
import { setLogs, workoutSessions, exercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { bodyPartLabel } from "@/lib/body-parts";
import { Card, PageHeader } from "@/components/ui";
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

  const [exercise] = await db
    .select()
    .from(exercises)
    .where(eq(exercises.id, exerciseId));
  if (!exercise) notFound();

  const sets = await db
    .select({
      sessionId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      weight: setLogs.weight,
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
    maxReps: number | null;
    volume: number | null;
    sets: number;
  };
  const rows: Row[] = [];
  for (const s of sets) {
    let r = rows.find((x) => x.sessionId === s.sessionId);
    if (!r) {
      r = { sessionId: s.sessionId, startedAt: s.startedAt, maxWeight: null, maxReps: null, volume: null, sets: 0 };
      rows.push(r);
    }
    const w = s.weight ? Number(s.weight) : null;
    const reps = s.reps ?? null;
    if (w !== null) r.maxWeight = Math.max(r.maxWeight ?? 0, w);
    if (reps !== null) r.maxReps = Math.max(r.maxReps ?? 0, reps);
    if (w !== null && reps !== null) r.volume = (r.volume ?? 0) + w * reps;
    r.sets += 1;
  }

  const chartData = rows.map((r) => ({
    date: new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(r.startedAt),
    maxWeight: r.maxWeight,
    maxReps: r.maxReps,
    volume: r.volume !== null ? Math.round(r.volume) : null,
  }));

  const anyWeight = rows.some((r) => r.maxWeight !== null);
  const defaultMetric: Metric = anyWeight ? "maxWeight" : "maxReps";
  const unit = anyWeight ? "kg" : "reps";
  const pick = (r: Row) => (anyWeight ? r.maxWeight : r.maxReps);
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

      <Card className="flex items-center gap-3 p-3">
        <div className="h-18 w-18 shrink-0 overflow-hidden rounded-2xl">
          <ExerciseThumb src={exercise.gifUrl} alt={exercise.nameEs ?? exercise.name} className="h-full w-full" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          <div className="rounded-2xl bg-accent p-3 text-accent-foreground">
            <p className="text-[22px] font-bold leading-none tabular-nums">
              {best !== null ? `${best}` : "—"}
              <span className="ml-1 text-[12px] font-medium opacity-70">{unit}</span>
            </p>
            <p className="mt-1 text-[11px] opacity-70">Mejor marca</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3">
            <p className="text-[22px] font-bold leading-none tabular-nums">
              {latest !== null ? `${latest}` : "—"}
              <span className="ml-1 text-[12px] font-medium text-muted">{unit}</span>
            </p>
            <p className="mt-1 text-[11px] text-muted">Última sesión</p>
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted">
            Todavía no tienes sesiones registradas para este ejercicio.
          </p>
        </Card>
      ) : (
        <>
          <Card className="p-4">
            <p className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
              <TrendingUp className="h-4 w-4" />
              Por sesión
            </p>
            <ExerciseProgressChart data={chartData} defaultMetric={defaultMetric} />
          </Card>

          <ul className="flex flex-col gap-2">
            {[...rows].reverse().map((r) => (
              <li key={r.sessionId}>
                <Link href={`/progreso/sesion/${r.sessionId}`}>
                  <Card className="flex items-center justify-between px-4 py-3 text-[14px] transition active:scale-[0.99]">
                    <span className="text-muted">
                      {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(r.startedAt)}
                    </span>
                    <span className="flex items-center gap-3 tabular-nums">
                      <span className="text-muted">{r.sets} series</span>
                      <span className="font-semibold">
                        {r.maxWeight !== null ? `${r.maxWeight} kg` : r.maxReps !== null ? `${r.maxReps} reps` : "—"}
                      </span>
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
