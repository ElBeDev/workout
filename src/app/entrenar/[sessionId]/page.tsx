import { db } from "@/db";
import {
  workoutSessions,
  routines,
  routineExercises,
  exercises,
  setLogs,
} from "@/db/schema";
import { and, eq, desc, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Flag } from "lucide-react";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { RestTimer } from "@/components/RestTimer";
import { LogSetButton } from "@/components/LogSetButton";
import { logSet, finishSession } from "./actions";

type LastSet = { weight: string | null; reps: number | null };

async function getLastTimeSets(
  userId: string,
  exerciseId: string,
  excludeSessionId: string
): Promise<Map<number, LastSet>> {
  const rows = await db
    .select({
      sessionId: setLogs.sessionId,
      setNumber: setLogs.setNumber,
      weight: setLogs.weight,
      reps: setLogs.reps,
      startedAt: workoutSessions.startedAt,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(setLogs.exerciseId, exerciseId),
        eq(workoutSessions.userId, userId),
        ne(setLogs.sessionId, excludeSessionId)
      )
    )
    .orderBy(desc(workoutSessions.startedAt));

  if (rows.length === 0) return new Map();

  const lastSessionId = rows[0].sessionId;
  const map = new Map<number, LastSet>();
  for (const row of rows) {
    if (row.sessionId !== lastSessionId) continue;
    map.set(row.setNumber, { weight: row.weight, reps: row.reps });
  }
  return map;
}

export default async function EntrenarPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));
  if (!session) notFound();

  const [routine] = await db
    .select()
    .from(routines)
    .where(eq(routines.id, session.routineId));
  if (!routine) notFound();

  const items = await db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      gifUrl: exercises.gifUrl,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, routine.id))
    .orderBy(routineExercises.sortOrder);

  const currentLogs = await db
    .select()
    .from(setLogs)
    .where(eq(setLogs.sessionId, sessionId));
  const currentMap = new Map(
    currentLogs.map((log) => [`${log.exerciseId}-${log.setNumber}`, log])
  );

  const lastTimeByExercise = new Map<string, Map<number, LastSet>>();
  for (const item of items) {
    lastTimeByExercise.set(
      item.exerciseId,
      await getLastTimeSets(session.userId, item.exerciseId, sessionId)
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-2">
        <Link
          href={`/rutinas/${routine.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 dark:text-white/40"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{routine.name}</h1>
      </header>

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const lastTime = lastTimeByExercise.get(item.exerciseId) ?? new Map();
          return (
            <section
              key={item.exerciseId}
              className="rounded-2xl border border-black/10 bg-surface p-3 shadow-sm dark:border-white/10"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <ExerciseThumb
                    src={item.gifUrl}
                    alt={item.exerciseName}
                    className="h-full w-full"
                  />
                </div>
                <p className="text-sm font-semibold capitalize">{item.exerciseName}</p>
              </div>

              <div className="flex flex-col gap-2">
                {Array.from({ length: item.targetSets }, (_, i) => i + 1).map(
                  (setNumber) => {
                    const existing = currentMap.get(
                      `${item.exerciseId}-${setNumber}`
                    );
                    const last = lastTime.get(setNumber);
                    return (
                      <form
                        key={setNumber}
                        action={logSet}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="sessionId" value={sessionId} />
                        <input type="hidden" name="exerciseId" value={item.exerciseId} />
                        <input type="hidden" name="setNumber" value={setNumber} />

                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/5 text-[11px] font-medium text-black/50 dark:bg-white/10 dark:text-white/50">
                          {setNumber}
                        </span>

                        <input
                          name="weight"
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          defaultValue={existing?.weight ?? undefined}
                          placeholder={last ? `${last.weight ?? "-"} kg` : "kg"}
                          className="w-20 rounded-lg border border-black/10 px-2 py-2.5 text-sm dark:border-white/10 dark:bg-transparent"
                        />
                        <input
                          name="reps"
                          type="number"
                          inputMode="numeric"
                          defaultValue={existing?.reps ?? undefined}
                          placeholder={last ? `${last.reps ?? "-"} reps` : `${item.targetReps} reps`}
                          className="w-20 rounded-lg border border-black/10 px-2 py-2.5 text-sm dark:border-white/10 dark:bg-transparent"
                        />

                        <LogSetButton completed={Boolean(existing?.completed)} />
                      </form>
                    );
                  }
                )}
              </div>
            </section>
          );
        })}
      </div>

      <RestTimer />

      <form action={finishSession.bind(null, sessionId)}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3.5 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
        >
          <Flag className="h-4 w-4" />
          Terminar entrenamiento
        </button>
      </form>
    </div>
  );
}
