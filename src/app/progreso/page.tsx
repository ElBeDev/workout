import Link from "next/link";
import { db } from "@/db";
import { workoutSessions, routines, setLogs, exercises } from "@/db/schema";
import { getCurrentUserId } from "@/db/current-user";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  const userId = await getCurrentUserId();

  const sessions = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      routineName: routines.name,
    })
    .from(workoutSessions)
    .innerJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(30);

  const trainedExercises = await db
    .selectDistinct({ id: exercises.id, name: exercises.name })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
    .where(and(eq(workoutSessions.userId, userId), eq(setLogs.completed, true)))
    .orderBy(exercises.name);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Progreso</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Historial de sesiones y gráficas por ejercicio.
        </p>
      </header>

      {trainedExercises.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Por ejercicio</h2>
          <ul className="flex flex-col gap-1">
            {trainedExercises.map((ex) => (
              <li key={ex.id}>
                <Link
                  href={`/progreso/${ex.id}`}
                  className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm capitalize dark:border-white/10"
                >
                  {ex.name}
                  <span className="text-black/40 dark:text-white/40">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Sesiones</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Todavía no tienes sesiones registradas. Termina un entrenamiento
            para verlo aquí.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-black/10 p-3 dark:border-white/10"
              >
                <p className="text-sm font-medium">{s.routineName}</p>
                <p className="text-xs text-black/50 dark:text-white/50">
                  {new Intl.DateTimeFormat("es-MX", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(s.startedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
