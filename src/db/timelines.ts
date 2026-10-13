import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, exercises, setLogs, swimBlockLogs, workoutSessions } from "@/db/schema";
import { buildTimeline, type SetInput, type SwimInput, type Timeline } from "@/lib/xp";

/**
 * La línea de tiempo de XP de todas las cuentas (docs/gamificacion.md §4).
 * Se arma de todo el historial cada vez: con un gimnasio son cientos o pocos
 * miles de series, y así nada se desincroniza. `cache` hace que una página
 * que la pide varias veces (ranking, retos, tarjetas) la lea una sola.
 */
export const getTimelines = cache(async (): Promise<Map<string, Timeline>> => {
  const [people, sets, swims] = await Promise.all([
    db
      .select({
        id: users.id,
        days: users.goalWeeklyDays,
        sets: users.goalWeeklySets,
        volumeKg: users.goalWeeklyVolumeKg,
      })
      .from(users),
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
      .where(eq(setLogs.completed, true)),
    db
      .select({
        userId: workoutSessions.userId,
        at: swimBlockLogs.loggedAt,
        sessionId: swimBlockLogs.sessionId,
        meters: swimBlockLogs.actualDistanceMeters,
      })
      .from(swimBlockLogs)
      .innerJoin(workoutSessions, eq(swimBlockLogs.sessionId, workoutSessions.id))
      .where(eq(swimBlockLogs.completed, true)),
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
  return (await getTimelines()).get(userId) ?? EMPTY;
}

