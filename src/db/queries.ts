import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, max } from "drizzle-orm";
import { db } from "@/db";
import { routines, routineExercises, exercises, workoutSessions, setLogs, swimBlockLogs } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { localDate, weekKey, daysAgo } from "@/lib/dates";
import { toKg, type WeightUnit } from "@/lib/suggest";
import { BODY_PARTS, type BodyPart } from "@/lib/body-parts";

/**
 * Tope de duración de una sesión al sumarla en agregados (Progreso). Cierra
 * hacia adelante ya evita que una sesión quede abierta días de más, pero esto
 * es la red de seguridad: si una se cuela por cualquier otra vía, nunca
 * desbalancea un total o un promedio ella sola.
 */
export const MAX_SESSION_MINUTES = 6 * 60;

/**
 * Cierra una sesión que quedó abierta sin que el usuario la haya terminado de
 * verdad (rutina borrada mientras estaba abierta, o una sesión de un día
 * anterior que se reabrió sin querer). Sella `finishedAt` con la última
 * actividad real — la última serie registrada, o el inicio si no tiene ni
 * una — nunca con `new Date()`, que reflejaría la hora de quien la encontró
 * y no cuánto duró de verdad.
 */
export async function closeAbandonedSession(sessionId: string): Promise<void> {
  const [session] = await db
    .select({ startedAt: workoutSessions.startedAt })
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));
  if (!session) return;

  const [row] = await db
    .select({ last: max(setLogs.loggedAt) })
    .from(setLogs)
    .where(eq(setLogs.sessionId, sessionId));

  await db
    .update(workoutSessions)
    .set({ finishedAt: row?.last ?? session.startedAt })
    .where(and(eq(workoutSessions.id, sessionId), isNull(workoutSessions.finishedAt)));
}

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
      sum +
      Math.min(
        MAX_SESSION_MINUTES,
        Math.max(0, Math.round((s.finishedAt!.getTime() - s.startedAt.getTime()) / 60000))
      ),
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

export type FrequencyTrend = {
  thisWeekSessions: number;
  /** Promedio de sesiones/semana de las 4 semanas anteriores (sin contar la actual). */
  avgLast4Weeks: number;
  /** null si esas 4 semanas no tienen ninguna sesión (nada con qué comparar). */
  trendPct: number | null;
};

/**
 * Sesiones de esta semana contra el promedio de las 4 semanas anteriores.
 * Es semana-a-semana siempre (no depende del selector de rango de Progreso):
 * alguien que entrena una vez a la semana con la misma carga de siempre puede
 * ver "0 %" en la tendencia de carga sin que se note que la frecuencia real
 * se está cayendo — esto lo dice donde la carga no puede.
 */
export async function getFrequencyTrend(userId: string): Promise<FrequencyTrend> {
  const since = new Date();
  since.setDate(since.getDate() - 7 * 6); // margen: 4 semanas previas + desfase de zona horaria
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

  const byWeek = new Map<string, number>();
  for (const r of rows) {
    const wk = weekKey(localDate(r.startedAt));
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1);
  }

  const now = localDate(new Date());
  const thisWeekSessions = byWeek.get(weekKey(now)) ?? 0;

  let sum = 0;
  const cursor = new Date(now);
  for (let i = 0; i < 4; i++) {
    cursor.setUTCDate(cursor.getUTCDate() - 7);
    sum += byWeek.get(weekKey(cursor)) ?? 0;
  }
  const avgLast4Weeks = sum / 4;

  return {
    thisWeekSessions,
    avgLast4Weeks,
    trendPct: avgLast4Weeks > 0 ? ((thisWeekSessions - avgLast4Weeks) / avgLast4Weeks) * 100 : null,
  };
}

export type PersonalRecord = {
  exerciseId: string;
  weight: number | null;
  weightUnit: WeightUnit;
  plates: number | null;
  reps: number;
  /** Qué sesión tiene la marca — así el resumen de "recién terminada" sabe
   *  qué récords son suyos, sin guardar una bandera aparte que pudiera
   *  quedarse desactualizada si luego editas o borras esa serie. */
  sessionId: string;
};

/**
 * Puntaje comparable de una carga: placas si las hay (no se convierten, no
 * hay forma honesta de pasar "3 placas" a kilos), si no el peso en kg. Es el
 * mismo criterio en los dos lugares que deciden "¿esto es un récord?": el
 * cálculo por ejercicio de abajo y el aviso en el momento de marcar la serie
 * (`logSet`), para que nunca digan cosas distintas.
 */
export function recordScore(rec: { weight: number | string | null; weightUnit: WeightUnit; plates: number | null }): number {
  if (rec.plates !== null) return rec.plates;
  const weight = rec.weight !== null ? Number(rec.weight) : null;
  return weight !== null ? toKg(weight, rec.weightUnit) : 0;
}

/**
 * Mejor marca por ejercicio: la carga más alta registrada (por unidad) y, para
 * ejercicios sin carga, las reps máximas. Sale de `set_logs`, sin tabla nueva.
 */
export async function getPersonalRecords(userId: string): Promise<Map<string, PersonalRecord>> {
  const rows = await db
    .select({
      exerciseId: setLogs.exerciseId,
      sessionId: setLogs.sessionId,
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
    const score = recordScore({ weight, weightUnit: unit, plates: r.plates });
    const prev = best.get(r.exerciseId);
    const prevScore = prev ? recordScore(prev) : -1;
    if (score > prevScore || (score === prevScore && (r.reps ?? 0) > (prev?.reps ?? 0))) {
      best.set(r.exerciseId, {
        exerciseId: r.exerciseId,
        sessionId: r.sessionId,
        weight,
        weightUnit: unit,
        plates: r.plates,
        reps: r.reps ?? 0,
      });
    }
  }
  return best;
}

export type MuscleCoverage = {
  bodyPart: BodyPart;
  lastTrainedAt: Date | null;
  /** null = nunca se ha entrenado. */
  daysAgo: number | null;
};

/**
 * Hace cuántos días se entrenó cada grupo muscular del catálogo por última
 * vez, del más olvidado al más reciente. Los grupos sin ninguna serie nunca
 * van primero (son los más olvidados de todos). Sale de `exercises.body_part`
 * + `set_logs`, sin columnas nuevas.
 */
export async function getMuscleCoverage(userId: string): Promise<MuscleCoverage[]> {
  const rows = await db
    .select({ bodyPart: exercises.bodyPart, last: max(setLogs.loggedAt) })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
    .where(and(eq(workoutSessions.userId, userId), eq(setLogs.completed, true)))
    .groupBy(exercises.bodyPart);

  const lastByPart = new Map(rows.map((r) => [r.bodyPart, r.last]));
  const now = new Date();

  return BODY_PARTS.map(({ value }) => {
    const last = lastByPart.get(value) ?? null;
    return { bodyPart: value, lastTrainedAt: last, daysAgo: last ? daysAgo(last, now) : null };
  }).sort((a, b) => {
    if (a.daysAgo === null && b.daysAgo === null) return 0;
    if (a.daysAgo === null) return -1;
    if (b.daysAgo === null) return 1;
    return b.daysAgo - a.daysAgo;
  });
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
  routineKind: string | null;
  sets: number;
  volumeKg: number;
  distanceMeters: number;
  minutes: number;
};

/**
 * Sesiones terminadas con sus totales, para la lista de Progreso — respeta el
 * rango elegido arriba (`since`), con un tope de filas como red de seguridad
 * para el rango "Año". (Decisión B de docs/mejoras-progreso.md §5: "Por
 * ejercicio" sigue siendo de toda la vida siempre, porque un récord filtrado
 * por rango deja de ser un récord — sólo la lista de sesiones se acorta.)
 */
export async function getSessionSummaries(
  userId: string,
  { days, limit = 200 }: { days?: number; limit?: number } = {}
): Promise<SessionSummary[]> {
  const since = days !== undefined ? new Date(Date.now() - days * 86400000) : undefined;
  const rows = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      routineName: routines.name,
      routineKind: routines.kind,
    })
    .from(workoutSessions)
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        since ? gte(workoutSessions.startedAt, since) : undefined
      )
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const sessionIds = rows.map((r) => r.id);
  const [logs, swimLogs] = await Promise.all([
    db
      .select({
        sessionId: setLogs.sessionId,
        weight: setLogs.weight,
        weightUnit: setLogs.weightUnit,
        plates: setLogs.plates,
        reps: setLogs.reps,
        loggedAt: setLogs.loggedAt,
      })
      .from(setLogs)
      .where(and(eq(setLogs.completed, true), inArray(setLogs.sessionId, sessionIds))),
    db
      .select({ sessionId: swimBlockLogs.sessionId, actualDistanceMeters: swimBlockLogs.actualDistanceMeters })
      .from(swimBlockLogs)
      .where(and(eq(swimBlockLogs.completed, true), inArray(swimBlockLogs.sessionId, sessionIds))),
  ]);

  const totals = new Map<string, { sets: number; volumeKg: number }>();
  for (const log of logs) {
    const t = totals.get(log.sessionId) ?? { sets: 0, volumeKg: 0 };
    t.sets += 1;
    t.volumeKg += setVolumeKg(log);
    totals.set(log.sessionId, t);
  }

  const distanceBySession = new Map<string, number>();
  for (const l of swimLogs) {
    distanceBySession.set(
      l.sessionId,
      (distanceBySession.get(l.sessionId) ?? 0) + (l.actualDistanceMeters ?? 0)
    );
  }

  return rows.map((r) => ({
    ...r,
    sets: totals.get(r.id)?.sets ?? 0,
    volumeKg: Math.round(totals.get(r.id)?.volumeKg ?? 0),
    distanceMeters: Math.round(distanceBySession.get(r.id) ?? 0),
    minutes: r.finishedAt
      ? Math.min(
          MAX_SESSION_MINUTES,
          Math.max(0, Math.round((r.finishedAt.getTime() - r.startedAt.getTime()) / 60000))
        )
      : 0,
  }));
}
