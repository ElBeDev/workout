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
import { Flag, Repeat } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { Card, PageHeader, PrimaryButton } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { SessionHud } from "@/components/SessionHud";
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

const fieldClass =
  "w-full rounded-2xl border border-border bg-surface-2 px-3 py-3 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent";

export default async function EntrenarPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const userId = await requireUserId();

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));
  if (!session || session.userId !== userId || !session.routineId) notFound();

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

  const totalSets = items.reduce((sum, i) => sum + i.targetSets, 0);
  const completedSets = currentLogs.filter((l) => l.completed).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={routine.name} backHref={`/rutinas/${routine.id}`} />

      <SessionHud
        startedAtMs={session.startedAt.getTime()}
        completed={completedSets}
        total={totalSets}
      />

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const lastTime = lastTimeByExercise.get(item.exerciseId) ?? new Map();
          return (
            <Card key={item.exerciseId} className="p-3">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                  <ExerciseThumb
                    src={item.gifUrl}
                    alt={item.exerciseName}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold capitalize">
                    {item.exerciseName}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted">
                    <Repeat className="h-3.5 w-3.5" />
                    {item.targetSets} × {item.targetReps} reps
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {Array.from({ length: item.targetSets }, (_, i) => i + 1).map(
                  (setNumber) => {
                    const existing = currentMap.get(`${item.exerciseId}-${setNumber}`);
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

                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/40 text-[12px] font-semibold text-accent-strong">
                          {setNumber}
                        </span>

                        <input
                          name="weight"
                          type="number"
                          step="0.5"
                          inputMode="decimal"
                          defaultValue={existing?.weight ?? undefined}
                          placeholder={last ? `${last.weight ?? "-"} kg` : "kg"}
                          className={fieldClass}
                        />
                        <input
                          name="reps"
                          type="number"
                          inputMode="numeric"
                          defaultValue={existing?.reps ?? undefined}
                          placeholder={last ? `${last.reps ?? "-"} reps` : `${item.targetReps} reps`}
                          className={fieldClass}
                        />

                        <LogSetButton completed={Boolean(existing?.completed)} />
                      </form>
                    );
                  }
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <form action={finishSession.bind(null, sessionId)}>
        <PrimaryButton type="submit">
          <Flag className="h-4 w-4" />
          Terminar entrenamiento
        </PrimaryButton>
      </form>
    </div>
  );
}
