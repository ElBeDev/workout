import { cache } from "react";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users, exercises, setLogs, swimBlockLogs, workoutSessions } from "@/db/schema";
import { buildTimeline, type SetInput, type SwimInput, type Timeline } from "@/lib/xp";

/**
 * La línea de tiempo de XP de un grupo de cuentas (docs/gamificacion.md §4).
 * Se arma de todo su historial cada vez, y así nada se desincroniza. Sólo de
 * quienes se piden: desde la Decimoséptima hay muchos grupos, y armar la de
 * todas las cuentas en cada página ya no escala (docs/coaches.md §5).
 *
 * `cache` hace que una página que la pide varias veces (ranking, retos,
 * tarjetas) la lea una sola. Va por una clave de texto porque `cache` compara
 * argumentos por identidad, y dos listas iguales serían dos llamadas.
 */
export function getTimelines(userIds: string[]): Promise<Map<string, Timeline>> {
  if (userIds.length === 0) return Promise.resolve(new Map());
  return timelinesFor([...new Set(userIds)].sort().join(","));
}

const timelinesFor = cache(async (key: string): Promise<Map<string, Timeline>> => {
  const ids = key.split(",");
  const [people, sets, swims] = await Promise.all([
    db
      .select({
        id: users.id,
        days: users.goalWeeklyDays,
        sets: users.goalWeeklySets,
        volumeKg: users.goalWeeklyVolumeKg,
      })
      .from(users)
      .where(inArray(users.id, ids)),
    db
      .select({
        userId: workoutSessions.userId,
        at: setLogs.loggedAt,
        sessionId: setLogs.sessionId,
        exerciseId: setLogs.exerciseId,
        measure: exercises.measure,
        weight: setLogs.weight,
        weightUnit: setLogs.weightUnit,
        plates: setLogs.plates,
        reps: setLogs.reps,
      })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
      .where(and(eq(setLogs.completed, true), inArray(workoutSessions.userId, ids))),
    db
      .select({
        userId: workoutSessions.userId,
        at: swimBlockLogs.loggedAt,
        sessionId: swimBlockLogs.sessionId,
        meters: swimBlockLogs.actualDistanceMeters,
      })
      .from(swimBlockLogs)
      .innerJoin(workoutSessions, eq(swimBlockLogs.sessionId, workoutSessions.id))
      .where(and(eq(swimBlockLogs.completed, true), inArray(workoutSessions.userId, ids))),
  ]);

  const setsBy = new Map<string, SetInput[]>();
  for (const { userId, ...s } of sets) {
    const list = setsBy.get(userId) ?? [];
    list.push(s);
    setsBy.set(userId, list);
  }
  const swimsBy = new Map<string, SwimInput[]>();
  for (const { userId, meters, ...s } of swims) {
    const list = swimsBy.get(userId) ?? [];
    list.push({ ...s, meters: meters ?? 0 });
    swimsBy.set(userId, list);
  }

  return new Map(
    people.map((p) => [
      p.id,
      buildTimeline(setsBy.get(p.id) ?? [], swimsBy.get(p.id) ?? [], {
        days: p.days,
        sets: p.sets,
        volumeKg: p.volumeKg,
      }),
    ])
  );
});

const EMPTY: Timeline = {
  events: [],
  medals: [],
  totalXp: 0,
  stats: { days: 0, records: 0, kg: 0, meters: 0, bestStreak: 0, ringWeeks: 0 },
};

export async function getTimeline(userId: string): Promise<Timeline> {
  return (await getTimelines([userId])).get(userId) ?? EMPTY;
}

