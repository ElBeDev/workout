import { db } from "@/db";
import {
  workoutSessions,
  routines,
  routineExercises,
  exercises,
  setLogs,
} from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { and, eq, desc, ne, inArray, isNotNull, or, isNull } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Flag, Plus, Repeat } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { Card, PageHeader, PrimaryButton } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { ExerciseInfoSheet } from "@/components/ExerciseInfoSheet";
import { SessionHud } from "@/components/SessionHud";
import { SuggestionPill } from "@/components/SuggestionPill";
import { suggestNext, type LoadUnit } from "@/lib/suggest";
import { DiscardSessionButton } from "@/components/DiscardSessionButton";
import { SessionNotes } from "./SessionNotes";
import { SetRow } from "./SetRow";
import { PendingSync } from "./PendingSync";
import { finishSession, addExtraSet } from "./actions";

type LastSet = { weight: string | null; plates: number | null; reps: number | null };

/**
 * For each exercise, the sets of the most recent *finished* session (other
 * than this one) — two queries total instead of one per exercise.
 */
async function getLastTimeSets(
  userId: string,
  exerciseIds: string[],
  excludeSessionId: string
): Promise<Map<string, Map<number, LastSet>>> {
  const result = new Map<string, Map<number, LastSet>>();
  if (exerciseIds.length === 0) return result;

  const latest = await db
    .selectDistinctOn([setLogs.exerciseId], {
      exerciseId: setLogs.exerciseId,
      sessionId: setLogs.sessionId,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        inArray(setLogs.exerciseId, exerciseIds),
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        ne(setLogs.sessionId, excludeSessionId),
        eq(setLogs.completed, true)
      )
    )
    .orderBy(setLogs.exerciseId, desc(workoutSessions.startedAt));

  if (latest.length === 0) return result;

  const pairs = latest.map((l) => and(eq(setLogs.exerciseId, l.exerciseId), eq(setLogs.sessionId, l.sessionId))!);
  const rows = await db
    .select({
      exerciseId: setLogs.exerciseId,
      setNumber: setLogs.setNumber,
      weight: setLogs.weight,
      plates: setLogs.plates,
      reps: setLogs.reps,
    })
    .from(setLogs)
    .where(and(eq(setLogs.completed, true), or(...pairs)));

  for (const row of rows) {
    if (!result.has(row.exerciseId)) result.set(row.exerciseId, new Map());
    result.get(row.exerciseId)!.set(row.setNumber, { weight: row.weight, plates: row.plates, reps: row.reps });
  }
  return result;
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
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));
  if (!session) notFound();

  // Already finished: nothing to log here, show the summary instead.
  if (session.finishedAt) redirect(`/progreso/sesion/${sessionId}`);

  // Its routine was deleted while it was open: close it with what it has
  // instead of leaving it stuck (its sets are intact).
  if (!session.routineId) {
    await db
      .update(workoutSessions)
      .set({ finishedAt: new Date() })
      .where(and(eq(workoutSessions.id, sessionId), isNull(workoutSessions.finishedAt)));
    redirect(`/progreso/sesion/${sessionId}`);
  }

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
      loadUnit: routineExercises.loadUnit,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.routineId, routine.id))
    .orderBy(routineExercises.sortOrder);

  const [currentLogs, lastTimeByExercise] = await Promise.all([
    db.select().from(setLogs).where(eq(setLogs.sessionId, sessionId)),
    getLastTimeSets(
      userId,
      items.map((i) => i.exerciseId),
      sessionId
    ),
  ]);

  const currentMap = new Map(
    currentLogs.map((log) => [`${log.exerciseId}-${log.setNumber}`, log])
  );

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

      <PendingSync userId={userId} sessionId={sessionId} />

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const lastTime = lastTimeByExercise.get(item.exerciseId) ?? new Map<number, LastSet>();
          const rows = rowCount.get(item.exerciseId) ?? item.targetSets;
          const unit: LoadUnit = item.loadUnit === "plates" ? "plates" : "kg";
          const suggestion = suggestNext(lastTime, item.targetSets, item.targetReps, unit);
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
                    {unit === "plates" && <span className="opacity-70"> · placas</span>}
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
                      userId={userId}
                      sessionId={sessionId}
                      exerciseId={item.exerciseId}
                      setNumber={setNumber}
                      extra={setNumber > item.targetSets}
                      completed={Boolean(existing?.completed)}
                      weight={existing?.weight ?? null}
                      plates={existing?.plates ?? null}
                      reps={existing?.reps ?? null}
                      loadUnit={unit}
                      loadPlaceholder={
                        unit === "plates"
                          ? last?.plates ? `${last.plates} placas` : "placas"
                          : last?.weight ? `${last.weight} kg` : "kg"
                      }
                      repsPlaceholder={last?.reps ? `${last.reps} reps` : `${item.targetReps} reps`}
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
