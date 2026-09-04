import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, max } from "drizzle-orm";
import { db } from "@/db";
import { routines, routineExercises, exercises, workoutSessions } from "@/db/schema";
import { localDate, weekKey } from "@/lib/dates";

export type OpenSession = {
  id: string;
  startedAt: Date;
  routineId: string | null;
  routineName: string | null;
};

export async function getOpenSession(userId: string): Promise<OpenSession | null> {
  const [row] = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      routineId: workoutSessions.routineId,
      routineName: routines.name,
    })
    .from(workoutSessions)
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(and(eq(workoutSessions.userId, userId), isNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  return row ?? null;
}

export type RoutineSummary = {
  id: string;
  name: string;
  days: number[];
  exerciseCount: number;
  totalSets: number;
  thumbUrl: string | null;
  lastDoneAt: Date | null;
};

export async function getRoutineSummaries(userId: string): Promise<RoutineSummary[]> {
  const rows = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(routines.sortOrder, routines.createdAt);

  if (rows.length === 0) return [];

  const lastDone = await db
    .select({
      routineId: workoutSessions.routineId,
      last: max(workoutSessions.startedAt),
    })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt)))
    .groupBy(workoutSessions.routineId);
  const lastDoneMap = new Map(lastDone.map((r) => [r.routineId, r.last]));

  const items = await db
    .select({
      routineId: routineExercises.routineId,
      sortOrder: routineExercises.sortOrder,
      targetSets: routineExercises.targetSets,
      gifUrl: exercises.gifUrl,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(
      inArray(
        routineExercises.routineId,
        rows.map((r) => r.id)
      )
    )
    .orderBy(asc(routineExercises.sortOrder));

  return rows.map((routine) => {
    const mine = items.filter((i) => i.routineId === routine.id);
    return {
      id: routine.id,
      name: routine.name,
      days: routine.days ?? [],
      exerciseCount: mine.length,
      totalSets: mine.reduce((sum, i) => sum + i.targetSets, 0),
      thumbUrl: mine[0]?.gifUrl ?? null,
      lastDoneAt: lastDoneMap.get(routine.id) ?? null,
    };
  });
}

export type WeeklyStats = {
  thisWeek: number;
  streakWeeks: number;
};

/** Sessions this week and how many consecutive weeks (incl. this one) had ≥1 session. */
export async function getWeeklyStats(userId: string): Promise<WeeklyStats> {
  const since = new Date();
  since.setDate(since.getDate() - 7 * 26);
  const rows = await db
    .select({ startedAt: workoutSessions.startedAt })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        gte(workoutSessions.startedAt, since)
      )
    );

  const weekKeys = new Set(rows.map((r) => weekKey(localDate(r.startedAt))));
  const now = localDate(new Date());
  const thisWeek = rows.filter((r) => weekKey(localDate(r.startedAt)) === weekKey(now)).length;

  let streakWeeks = 0;
  const cursor = new Date(now);
  // If this week is still empty, count the streak from last week so it doesn't
  // reset on Monday morning.
  if (!weekKeys.has(weekKey(cursor))) cursor.setDate(cursor.getDate() - 7);
  while (weekKeys.has(weekKey(cursor))) {
    streakWeeks += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return { thisWeek, streakWeeks };
}
