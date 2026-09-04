import { db } from "@/db";
import { setLogs, workoutSessions, exercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, eq, max, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { bodyPartLabel } from "@/lib/body-parts";
import { Card, PageHeader } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ExerciseProgressChart } from "@/components/ExerciseProgressChart";

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

  const rows = await db
    .select({
      startedAt: workoutSessions.startedAt,
      maxWeight: max(setLogs.weight),
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
    .groupBy(workoutSessions.id, workoutSessions.startedAt)
    .orderBy(asc(workoutSessions.startedAt));

  const chartData = rows.map((row) => ({
    date: new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
      row.startedAt
    ),
    maxWeight: row.maxWeight ? Number(row.maxWeight) : null,
  }));

  const best = rows.reduce<number | null>((acc, r) => {
    const v = r.maxWeight ? Number(r.maxWeight) : null;
    if (v === null) return acc;
    return acc === null ? v : Math.max(acc, v);
  }, null);
  const latest = chartData.at(-1)?.maxWeight ?? null;

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
          <ExerciseThumb src={exercise.gifUrl} alt={exercise.name} className="h-full w-full" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          <div className="rounded-2xl bg-accent p-3 text-accent-foreground">
            <p className="text-[22px] font-bold leading-none tabular-nums">
              {best !== null ? `${best}` : "—"}
              <span className="ml-1 text-[12px] font-medium opacity-70">kg</span>
            </p>
            <p className="mt-1 text-[11px] opacity-70">Mejor marca</p>
          </div>
          <div className="rounded-2xl bg-surface-2 p-3">
            <p className="text-[22px] font-bold leading-none tabular-nums">
              {latest !== null ? `${latest}` : "—"}
              <span className="ml-1 text-[12px] font-medium text-muted">kg</span>
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
            <p className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted">
              <TrendingUp className="h-4 w-4" />
              Peso máximo por sesión
            </p>
            <ExerciseProgressChart data={chartData} />
          </Card>

          <ul className="flex flex-col gap-2">
            {[...rows].reverse().map((row, i) => (
              <li key={i}>
                <Card className="flex items-center justify-between px-4 py-3 text-[14px]">
                  <span className="text-muted">
                    {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
                      row.startedAt
                    )}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {row.maxWeight ? `${row.maxWeight} kg` : "—"}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
