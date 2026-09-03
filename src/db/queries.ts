import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { routines, routineExercises, exercises } from "@/db/schema";

export type RoutineSummary = {
  id: string;
  name: string;
  exerciseCount: number;
  totalSets: number;
  thumbUrl: string | null;
};

export async function getRoutineSummaries(userId: string): Promise<RoutineSummary[]> {
  const rows = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(routines.sortOrder, routines.createdAt);

  if (rows.length === 0) return [];

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
      exerciseCount: mine.length,
      totalSets: mine.reduce((sum, i) => sum + i.targetSets, 0),
      thumbUrl: mine[0]?.gifUrl ?? null,
    };
  });
}
