import { db } from "@/db";
import { setLogs, workoutSessions, exercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, eq, max, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <Link
          href="/progreso"
          className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 dark:text-white/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold capitalize tracking-tight">{exercise.name}</h1>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-black/50 dark:text-white/50">
          Todavía no tienes sesiones registradas para este ejercicio.
        </p>
      ) : (
        <>
          <section className="rounded-2xl border border-black/10 bg-surface p-3 shadow-sm dark:border-white/10">
            <p className="mb-2 text-xs font-medium text-black/50 dark:text-white/50">
              Peso máximo por sesión (kg)
            </p>
            <ExerciseProgressChart data={chartData} />
          </section>

          <ul className="flex flex-col gap-2">
            {[...rows].reverse().map((row, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-black/10 bg-surface px-3 py-2.5 text-sm shadow-sm dark:border-white/10"
              >
                <span className="text-black/50 dark:text-white/50">
                  {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
                    row.startedAt
                  )}
                </span>
                <span className="font-semibold">
                  {row.maxWeight ? `${row.maxWeight} kg` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
