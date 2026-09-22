import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, max } from "drizzle-orm";
import { db } from "@/db";
import { routines, routineExercises, exercises, workoutSessions, setLogs } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { localDate, weekKey } from "@/lib/dates";
import { toKg, type WeightUnit } from "@/lib/suggest";

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
      gifUrl: exerciseGif,
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

/* ── Anillos, tendencias y récords (docs/diseno-apple-fitness.md §7) ───────── */

type CompletedSet = {
  weight: string | null;
  weightUnit: string;
  plates: number | null;
  reps: number | null;
  loggedAt: Date;
};

/**
 * Series marcadas del usuario desde `since`. Incluye las de la sesión abierta
 * a propósito: los anillos tienen que moverse mientras entrenas, no al final.
 */
async function getCompletedSets(userId: string, since: Date): Promise<CompletedSet[]> {
  return db
    .select({
      weight: setLogs.weight,
      weightUnit: setLogs.weightUnit,
      plates: setLogs.plates,
      reps: setLogs.reps,
      loggedAt: setLogs.loggedAt,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(setLogs.completed, true),
        gte(setLogs.loggedAt, since)
      )
    );
}

/**
 * Carga de una serie en kg. Las placas quedan fuera: no hay forma honesta de
 * convertir "3 placas" a kilos, y meter un número inventado arruinaría el
 * anillo de carga.
 */
function setVolumeKg(s: CompletedSet): number {
  if (!s.weight || !s.reps) return 0;
  const w = Number(s.weight);
  if (!Number.isFinite(w) || w <= 0) return 0;
  return toKg(w, (s.weightUnit === "lbs" ? "lbs" : "kg") as WeightUnit) * s.reps;
}

export type WeeklyRings = {
  volumeKg: number;
  volumeGoal: number;
  sets: number;
  setsGoal: number;
  days: number;
  daysGoal: number;
  /** Porcentaje promedio de los tres anillos, 0–1+. */
  overall: number;
};

export type RingGoals = {
  volumeKg: number;
  sets: number;
  days: number;
};

/** Los tres anillos de la semana en curso (lunes a domingo, hora de México). */
export async function getWeeklyRings(userId: string, goals: RingGoals): Promise<WeeklyRings> {
  const since = new Date();
  since.setDate(since.getDate() - 9); // margen para el desfase de zona horaria
  const rows = await getCompletedSets(userId, since);

  const thisWeek = weekKey(localDate(new Date()));
  const mine = rows.filter((r) => weekKey(localDate(r.loggedAt)) === thisWeek);

  const volumeKg = Math.round(mine.reduce((sum, r) => sum + setVolumeKg(r), 0));
  const sets = mine.length;
  const days = new Set(mine.map((r) => localDate(r.loggedAt).toISOString().slice(0, 10))).size;

  const pct = (v: number, g: number) => (g > 0 ? v / g : 0);
  return {
    volumeKg,
    volumeGoal: goals.volumeKg,
    sets,
    setsGoal: goals.sets,
    days,
    daysGoal: goals.days,
    overall:
      (pct(volumeKg, goals.volumeKg) + pct(sets, goals.sets) + pct(days, goals.days)) / 3,
  };
}

export type PeriodStats = {
  days: number;
  sessions: number;
  sets: number;
  volumeKg: number;
  minutes: number;
  /** Cambio porcentual del volumen contra el periodo anterior del mismo largo. */
  volumeTrendPct: number | null;
  setsTrendPct: number | null;
};

/** Totales del periodo y su comparación contra el periodo inmediato anterior. */
export async function getPeriodStats(userId: string, days: number): Promise<PeriodStats> {
  const now = Date.now();
  const cut = new Date(now - days * 86400000);
  const prevCut = new Date(now - days * 2 * 86400000);

  const [sets, sessions] = await Promise.all([
    getCompletedSets(userId, prevCut),
    db
      .select({ startedAt: workoutSessions.startedAt, finishedAt: workoutSessions.finishedAt })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNotNull(workoutSessions.finishedAt),
          gte(workoutSessions.startedAt, prevCut)
        )
      ),
  ]);

  const inCurrent = <T extends { loggedAt?: Date; startedAt?: Date }>(r: T) =>
    (r.loggedAt ?? r.startedAt!) >= cut;

  const current = sets.filter(inCurrent);
  const previous = sets.filter((r) => !inCurrent(r));
  const currentSessions = sessions.filter(inCurrent);

  const vol = (rows: CompletedSet[]) => rows.reduce((sum, r) => sum + setVolumeKg(r), 0);
  const trend = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);

  const minutes = currentSessions.reduce(
    (sum, s) =>
      sum + Math.max(0, Math.round((s.finishedAt!.getTime() - s.startedAt.getTime()) / 60000)),
    0
  );

  return {
    days,
    sessions: currentSessions.length,
    sets: current.length,
    volumeKg: Math.round(vol(current)),
    minutes,
    volumeTrendPct: trend(vol(current), vol(previous)),
    setsTrendPct: trend(current.length, previous.length),
  };
}

export type PersonalRecord = {
  exerciseId: string;
  weight: number | null;
  weightUnit: WeightUnit;
  plates: number | null;
  reps: number;
};

/**
 * Mejor marca por ejercicio: la carga más alta registrada (por unidad) y, para
 * ejercicios sin carga, las reps máximas. Sale de `set_logs`, sin tabla nueva.
 */
export async function getPersonalRecords(userId: string): Promise<Map<string, PersonalRecord>> {
  const rows = await db
    .select({
      exerciseId: setLogs.exerciseId,
      weight: setLogs.weight,
      weightUnit: setLogs.weightUnit,
      plates: setLogs.plates,
      reps: setLogs.reps,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(and(eq(workoutSessions.userId, userId), eq(setLogs.completed, true)));

  const best = new Map<string, PersonalRecord>();
  for (const r of rows) {
    const unit: WeightUnit = r.weightUnit === "lbs" ? "lbs" : "kg";
    const weight = r.weight ? Number(r.weight) : null;
    const score = r.plates ?? (weight !== null ? toKg(weight, unit) : 0);
    const prev = best.get(r.exerciseId);
    const prevScore = prev
      ? (prev.plates ?? (prev.weight !== null ? toKg(prev.weight, prev.weightUnit) : 0))
      : -1;
    if (score > prevScore || (score === prevScore && (r.reps ?? 0) > (prev?.reps ?? 0))) {
      best.set(r.exerciseId, {
        exerciseId: r.exerciseId,
        weight,
        weightUnit: unit,
        plates: r.plates,
        reps: r.reps ?? 0,
      });
    }
  }
  return best;
}

export type TrainingDay = {
  /** Fecha local (hora de México) en formato YYYY-MM-DD. */
  date: string;
  sets: number;
  volumeKg: number;
};

/** Actividad por día de los últimos `days` días, para el calendario de anillos. */
export async function getDailyTraining(
  userId: string,
  days: number
): Promise<Map<string, TrainingDay>> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await getCompletedSets(userId, since);

  const byDay = new Map<string, TrainingDay>();
  for (const r of rows) {
    const date = localDate(r.loggedAt).toISOString().slice(0, 10);
    const day = byDay.get(date) ?? { date, sets: 0, volumeKg: 0 };
    day.sets += 1;
    day.volumeKg += setVolumeKg(r);
    byDay.set(date, day);
  }
  return byDay;
}

export type SessionSummary = {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  routineName: string | null;
  sets: number;
  volumeKg: number;
  minutes: number;
};

/** Sesiones terminadas con sus totales, para la lista de Progreso. */
export async function getSessionSummaries(
  userId: string,
  limit = 30
): Promise<SessionSummary[]> {
  const rows = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      routineName: routines.name,
    })
    .from(workoutSessions)
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const logs = await db
    .select({
      sessionId: setLogs.sessionId,
      weight: setLogs.weight,
      weightUnit: setLogs.weightUnit,
      plates: setLogs.plates,
      reps: setLogs.reps,
      loggedAt: setLogs.loggedAt,
    })
    .from(setLogs)
    .where(
      and(
        eq(setLogs.completed, true),
        inArray(
          setLogs.sessionId,
          rows.map((r) => r.id)
        )
      )
    );

  const totals = new Map<string, { sets: number; volumeKg: number }>();
  for (const log of logs) {
    const t = totals.get(log.sessionId) ?? { sets: 0, volumeKg: 0 };
    t.sets += 1;
    t.volumeKg += setVolumeKg(log);
    totals.set(log.sessionId, t);
  }

  return rows.map((r) => ({
    ...r,
    sets: totals.get(r.id)?.sets ?? 0,
    volumeKg: Math.round(totals.get(r.id)?.volumeKg ?? 0),
    minutes: r.finishedAt
      ? Math.max(0, Math.round((r.finishedAt.getTime() - r.startedAt.getTime()) / 60000))
      : 0,
  }));
}
