import Link from "next/link";
import { ChevronRight, CalendarClock } from "lucide-react";
import { db } from "@/db";
import { workoutSessions, routines, setLogs, exercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { bodyPartLabel } from "@/lib/body-parts";
import { ExerciseThumb } from "@/components/ExerciseThumb";

export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  const userId = await requireUserId();

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
    .selectDistinct({
      id: exercises.id,
      name: exercises.name,
      bodyPart: exercises.bodyPart,
      gifUrl: exercises.gifUrl,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
    .where(and(eq(workoutSessions.userId, userId), eq(setLogs.completed, true)))
    .orderBy(exercises.name);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Progreso</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Historial de sesiones y gráficas por ejercicio.
        </p>
      </header>

      {trainedExercises.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">Por ejercicio</h2>
          <ul className="flex flex-col gap-2">
            {trainedExercises.map((ex) => (
              <li key={ex.id}>
                <Link
                  href={`/progreso/${ex.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-surface p-2.5 shadow-sm dark:border-white/10"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                    <ExerciseThumb src={ex.gifUrl} alt={ex.name} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium capitalize">{ex.name}</p>
                    <p className="text-[11px] text-black/40 dark:text-white/40">
                      {bodyPartLabel(ex.bodyPart)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-black/30 dark:text-white/30" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Sesiones</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-black/50 dark:text-white/50">
            Todavía no tienes sesiones registradas. Termina un entrenamiento
            para verlo aquí.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-black/10 bg-surface p-3 shadow-sm dark:border-white/10"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{s.routineName}</p>
                  <p className="text-xs text-black/45 dark:text-white/45">
                    {new Intl.DateTimeFormat("es-MX", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(s.startedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
