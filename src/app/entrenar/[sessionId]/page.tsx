import { db } from "@/db";
import {
  workoutSessions,
  routines,
  routineExercises,
  exercises,
  setLogs,
  users,
} from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { and, eq, desc, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Flag, Plus, Repeat } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { Card, PageHeader, PrimaryButton } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ExerciseInfoSheet } from "@/components/ExerciseInfoSheet";
import { SessionHud } from "@/components/SessionHud";
import { SuggestionPill } from "@/components/SuggestionPill";
import { suggestNext } from "@/lib/suggest";
import { DiscardSessionButton } from "@/components/DiscardSessionButton";
import { SessionNotes } from "./SessionNotes";
import { SetRow } from "./SetRow";
import { PendingSync } from "./PendingSync";
import { finishSession, addExtraSet } from "./actions";

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
        ne(setLogs.sessionId, excludeSessionId),
        eq(setLogs.completed, true)
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
      exerciseNameEs: exercises.nameEs,
      gifUrl: exerciseGif,
      bodyPart: exercises.bodyPart,
      equipment: exercises.equipment,
      instructions: exercises.instructions,
      targetSets: routineExercises.targetSets,
      targetReps: routineExercises.targetReps,
      restSeconds: routineExercises.restSeconds,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, routine.id))
    .orderBy(routineExercises.sortOrder);

  const [me] = await db.select({ restSeconds: users.restSeconds }).from(users).where(eq(users.id, userId));
  const defaultRest = me?.restSeconds ?? 90;

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

  // Rows per exercise = target sets, plus any extra sets added on the fly.
  const rowCount = new Map<string, number>();
  for (const item of items) {
    const logged = currentLogs
      .filter((l) => l.exerciseId === item.exerciseId)
      .reduce((m, l) => Math.max(m, l.setNumber), 0);
    rowCount.set(item.exerciseId, Math.max(item.targetSets, logged));
  }

  const totalSets = Array.from(rowCount.values()).reduce((a, b) => a + b, 0);
  const completedSets = currentLogs.filter((l) => l.completed).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={routine.name} backHref={`/rutinas/${routine.id}`} />

      <SessionHud
        startedAtMs={session.startedAt.getTime()}
        completed={completedSets}
        total={totalSets}
      />

      <PendingSync sessionId={sessionId} />

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const lastTime = lastTimeByExercise.get(item.exerciseId) ?? new Map<number, LastSet>();
          const rows = rowCount.get(item.exerciseId) ?? item.targetSets;
          const suggestion = suggestNext(lastTime, item.targetSets, item.targetReps);
          return (
            <Card key={item.exerciseId} className="p-3">
              <div className="mb-3 flex items-center gap-3">
                <ExerciseInfoSheet
                  exercise={{
                    name: item.exerciseName,
                    nameEs: item.exerciseNameEs,
                    gifUrl: item.gifUrl,
                    bodyPart: item.bodyPart,
                    equipment: item.equipment,
                    instructions: item.instructions,
                  }}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl"
                >
                  <ExerciseThumb
                    src={item.gifUrl}
                    alt={item.exerciseNameEs ?? item.exerciseName}
                    className="h-full w-full"
                  />
                </ExerciseInfoSheet>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold capitalize">
                    {item.exerciseNameEs ?? item.exerciseName}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[13px] text-muted">
                    <Repeat className="h-3.5 w-3.5" />
                    {item.targetSets} × {item.targetReps} reps
                    <span className="opacity-70"> · descanso {item.restSeconds ?? defaultRest}s</span>
                  </p>
                </div>
              </div>

              {suggestion && <SuggestionPill exerciseId={item.exerciseId} suggestion={suggestion} />}

              <div className="flex flex-col gap-2">
                {Array.from({ length: rows }, (_, i) => i + 1).map((setNumber) => {
                  const existing = currentMap.get(`${item.exerciseId}-${setNumber}`);
                  const last = lastTime.get(setNumber);
                  return (
                    <SetRow
                      key={setNumber}
                      sessionId={sessionId}
                      exerciseId={item.exerciseId}
                      setNumber={setNumber}
                      extra={setNumber > item.targetSets}
                      completed={Boolean(existing?.completed)}
                      weight={existing?.weight ?? null}
                      reps={existing?.reps ?? null}
                      weightPlaceholder={last?.weight ? `${last.weight} kg` : "kg"}
                      repsPlaceholder={last?.reps ? `${last.reps} reps` : `${item.targetReps} reps`}
                      restSeconds={item.restSeconds ?? defaultRest}
                    />
                  );
                })}

                <form action={addExtraSet.bind(null, sessionId, item.exerciseId, rows)}>
                  <button
                    type="submit"
                    className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar serie
                  </button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>

      <SessionNotes sessionId={sessionId} notes={session.notes} />

      <form action={finishSession.bind(null, sessionId)}>
        <PrimaryButton type="submit">
          <Flag className="h-4 w-4" />
          Terminar entrenamiento
        </PrimaryButton>
      </form>

      <DiscardSessionButton sessionId={sessionId} />
    </div>
  );
}
