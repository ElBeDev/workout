import { db } from "@/db";
import { workoutSessions, routines } from "@/db/schema";
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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Progreso</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Historial de sesiones completadas.
        </p>
      </header>

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
    </div>
  );
}
