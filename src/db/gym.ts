import { and, asc, desc, eq, gte, inArray, isNull, lt, max, sql, type SQL } from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  users,
  routines,
  setLogs,
  swimBlockLogs,
  workoutSessions,
  coachComments,
  challenges,
} from "@/db/schema";
import { APP_TIME_ZONE, addDaysYmd, daysAgo, localDate, localDayStart, todayYmd, weekKey } from "@/lib/dates";
import { toKg } from "@/lib/suggest";

/* ── Métricas del ranking y de los retos (docs/coach-y-retos.md) ──────────── */

export const METRICS = ["volume", "days", "sets", "distance"] as const;
export type Metric = (typeof METRICS)[number];

export function isMetric(value: unknown): value is Metric {
  return typeof value === "string" && (METRICS as readonly string[]).includes(value);
}

/** Días sin entrenar a partir de los cuales el coach ve a alguien en rojo. */
export const INACTIVE_DAYS = 10;

/**
 * Nombre que ven los demás: el que la persona eligió en Perfil o, si no hay,
 * su usuario hasta la "@". Una cuenta cuyo usuario es un correo no puede
 * quedar expuesta completa en una tabla que ve todo el gimnasio.
 */
export function publicName(u: { displayName: string | null; username: string | null }): string {
  const chosen = u.displayName?.trim();
  if (chosen) return chosen;
  return (u.username ?? "").split("@")[0] || "—";
}

export type ActivityRow = {
  userId: string;
  name: string;
  volumeKg: number;
  sets: number;
  days: number;
  distanceMeters: number;
};

export function metricValue(row: ActivityRow, metric: Metric): number {
  switch (metric) {
    case "volume":
      return row.volumeKg;
    case "days":
      return row.days;
    case "sets":
      return row.sets;
    case "distance":
      return row.distanceMeters;
  }
}

/**
 * Fecha local (hora de México) de un timestamp guardado en UTC, como texto
 * YYYY-MM-DD. La zona va como literal y no como parámetro: si fuera `$1` en el
 * SELECT y `$3` en el GROUP BY, Postgres las toma por expresiones distintas.
 */
function localDay(col: AnyPgColumn): SQL<string> {
  return sql<string>`((${col} at time zone 'UTC') at time zone ${sql.raw(`'${APP_TIME_ZONE}'`)})::date::text`;
}

/** Libras a kilos dentro de SQL, como literal por la misma razón. */
const LB_TO_KG = sql.raw(String(toKg(1, "lbs")));

/**
 * Actividad de cada persona entre `since` (inclusive) y `until` (exclusivo):
 * carga en kg, series, días distintos con algo entrenado y metros nadados.
 *
 * Mismos criterios que los anillos: las series de la sesión abierta cuentan
 * (el ranking se mueve mientras entrenas) y las placas no suman carga (no hay
 * forma honesta de pasarlas a kilos). Un día cuenta si tuvo al menos una serie
 * o un bloque de natación marcado — por eso natación también suma asistencia.
 */
export async function getActivity(
  since: Date,
  until: Date,
  { includeHidden = false }: { includeHidden?: boolean } = {}
): Promise<ActivityRow[]> {
  const setRange = and(
    eq(setLogs.completed, true),
    gte(setLogs.loggedAt, since),
    lt(setLogs.loggedAt, until)
  );
  const swimRange = and(
    eq(swimBlockLogs.completed, true),
    gte(swimBlockLogs.loggedAt, since),
    lt(swimBlockLogs.loggedAt, until)
  );

  const [people, strength, strengthDays, swim] = await Promise.all([
    db
      .select({ id: users.id, username: users.username, displayName: users.displayName })
      .from(users)
      .where(includeHidden ? undefined : eq(users.showInRanking, true)),
    db
      .select({
        userId: workoutSessions.userId,
        sets: sql<number>`count(*)::int`,
        volumeKg: sql<number>`coalesce(sum(case when ${setLogs.weight} > 0 and ${setLogs.reps} > 0 then ${setLogs.weight} * ${setLogs.reps} * (case when ${setLogs.weightUnit} = 'lbs' then ${LB_TO_KG} else 1 end) else 0 end), 0)::float8`,
      })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .where(setRange)
      .groupBy(workoutSessions.userId),
    db
      .selectDistinct({ userId: workoutSessions.userId, day: localDay(setLogs.loggedAt) })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .where(setRange),
    db
      .select({
        userId: workoutSessions.userId,
        day: localDay(swimBlockLogs.loggedAt),
        meters: sql<number>`coalesce(sum(${swimBlockLogs.actualDistanceMeters}), 0)::int`,
      })
      .from(swimBlockLogs)
      .innerJoin(workoutSessions, eq(swimBlockLogs.sessionId, workoutSessions.id))
      .where(swimRange)
      .groupBy(workoutSessions.userId, localDay(swimBlockLogs.loggedAt)),
  ]);

  const strengthBy = new Map(strength.map((r) => [r.userId, r]));
  const daysBy = new Map<string, Set<string>>();
  const metersBy = new Map<string, number>();
  const addDay = (userId: string, day: string) => {
    const set = daysBy.get(userId) ?? new Set<string>();
    set.add(day);
    daysBy.set(userId, set);
  };
  for (const r of strengthDays) addDay(r.userId, r.day);
  for (const r of swim) {
    addDay(r.userId, r.day);
    metersBy.set(r.userId, (metersBy.get(r.userId) ?? 0) + Number(r.meters));
  }

  return people.map((p) => ({
    userId: p.id,
    name: publicName(p),
    volumeKg: Math.round(Number(strengthBy.get(p.id)?.volumeKg ?? 0)),
    sets: Number(strengthBy.get(p.id)?.sets ?? 0),
    days: daysBy.get(p.id)?.size ?? 0,
    distanceMeters: metersBy.get(p.id) ?? 0,
  }));
}

export type RankedRow = ActivityRow & { value: number; position: number };

/**
 * Ordena por la métrica, de mayor a menor, y deja fuera a quien va en cero.
 * Los empates comparten lugar (1, 1, 3), como en cualquier tabla deportiva.
 */
export function rank(rows: ActivityRow[], metric: Metric): RankedRow[] {
  const sorted = rows
    .map((r) => ({ ...r, value: metricValue(r, metric) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  let position = 0;
  return sorted.map((r, i) => {
    if (i === 0 || r.value !== sorted[i - 1].value) position = i + 1;
    return { ...r, position };
  });
}

export const PERIODS = ["semana", "mes"] as const;
export type Period = (typeof PERIODS)[number];

/** Semana (lunes a domingo) o mes calendario en curso, en hora de México. */
export function periodRange(period: Period, now = new Date()) {
  const today = todayYmd(now);
  let startYmd: string;
  let endYmd: string;
  if (period === "semana") {
    startYmd = weekKey(localDate(now));
    endYmd = addDaysYmd(startYmd, 6);
  } else {
    startYmd = `${today.slice(0, 7)}-01`;
    const nextMonth = new Date(`${startYmd}T00:00:00Z`);
    nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
    endYmd = addDaysYmd(nextMonth.toISOString().slice(0, 10), -1);
  }
  return {
    startYmd,
    endYmd,
    since: localDayStart(startYmd),
    until: localDayStart(addDaysYmd(endYmd, 1)),
  };
}

/* ── Retos ─────────────────────────────────────────────────────────────── */

export type Challenge = typeof challenges.$inferSelect;

/** Cuántos días de un reto ya terminado se sigue mostrando su resultado. */
const FINISHED_VISIBLE_DAYS = 30;

export async function getChallenges(now = new Date()) {
  const today = todayYmd(now);
  const rows = await db
    .select()
    .from(challenges)
    .where(gte(challenges.endsOn, addDaysYmd(today, -FINISHED_VISIBLE_DAYS)))
    .orderBy(asc(challenges.endsOn), asc(challenges.createdAt));

  return {
    active: rows.filter((c) => c.startsOn <= today && c.endsOn >= today),
    upcoming: rows.filter((c) => c.startsOn > today),
    finished: rows.filter((c) => c.endsOn < today).reverse(),
  };
}

/** Todos los retos, para el admin (los viejos también, para poder borrarlos). */
export async function getAllChallenges(): Promise<Challenge[]> {
  return db.select().from(challenges).orderBy(desc(challenges.startsOn), desc(challenges.createdAt));
}

/** La actividad de cada participante dentro de las fechas del reto. */
export function getChallengeActivity(c: Challenge): Promise<ActivityRow[]> {
  return getActivity(localDayStart(c.startsOn), localDayStart(addDaysYmd(c.endsOn, 1)));
}

/* ── Panel del coach ───────────────────────────────────────────────────── */

export type MemberStatus = {
  userId: string;
  username: string | null;
  name: string;
  isAdmin: boolean;
  routineCount: number;
  lastActiveAt: Date | null;
  /** null = nunca ha entrenado. */
  daysSince: number | null;
  last30: ActivityRow;
};

/**
 * Última vez que la persona entrenó de verdad: la última serie o bloque de
 * natación marcado, no la última sesión abierta (hay sesiones vacías).
 */
async function getLastActive(userIds?: string[]): Promise<Map<string, Date>> {
  const filter = userIds ? inArray(workoutSessions.userId, userIds) : undefined;
  const [sets, swims] = await Promise.all([
    db
      .select({ userId: workoutSessions.userId, last: max(setLogs.loggedAt) })
      .from(setLogs)
      .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
      .where(and(eq(setLogs.completed, true), filter))
      .groupBy(workoutSessions.userId),
    db
      .select({ userId: workoutSessions.userId, last: max(swimBlockLogs.loggedAt) })
      .from(swimBlockLogs)
      .innerJoin(workoutSessions, eq(swimBlockLogs.sessionId, workoutSessions.id))
      .where(and(eq(swimBlockLogs.completed, true), filter))
      .groupBy(workoutSessions.userId),
  ]);
  const last = new Map<string, Date>();
  for (const r of [...sets, ...swims]) {
    if (!r.last) continue;
    const prev = last.get(r.userId);
    if (!prev || r.last > prev) last.set(r.userId, r.last);
  }
  return last;
}

/** Todos los socios con su última actividad y sus números de 30 días. */
export async function getMemberStatuses(now = new Date()): Promise<MemberStatus[]> {
  const [people, routineCounts, lastActive, last30] = await Promise.all([
    db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        isAdmin: users.isAdmin,
      })
      .from(users),
    db
      .select({ userId: routines.userId, count: sql<number>`count(*)::int` })
      .from(routines)
      .groupBy(routines.userId),
    getLastActive(),
    getActivity(new Date(now.getTime() - 30 * 86400000), now, { includeHidden: true }),
  ]);

  const routinesBy = new Map(routineCounts.map((r) => [r.userId, r.count]));
  const activityBy = new Map(last30.map((r) => [r.userId, r]));

  return people.map((p) => {
    const lastAt = lastActive.get(p.id) ?? null;
    return {
      userId: p.id,
      username: p.username,
      name: publicName(p),
      isAdmin: p.isAdmin,
      routineCount: routinesBy.get(p.id) ?? 0,
      lastActiveAt: lastAt,
      daysSince: lastAt ? daysAgo(lastAt, now) : null,
      last30: activityBy.get(p.id) ?? {
        userId: p.id,
        name: publicName(p),
        volumeKg: 0,
        sets: 0,
        days: 0,
        distanceMeters: 0,
      },
    };
  });
}

export async function getLastActiveAt(userId: string): Promise<Date | null> {
  return (await getLastActive([userId])).get(userId) ?? null;
}

/* ── Comentarios del coach ─────────────────────────────────────────────── */

export type CoachComment = {
  id: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  sessionId: string | null;
  sessionStartedAt: Date | null;
  routineName: string | null;
  authorName: string | null;
};

const author = alias(users, "author");

function commentsQuery() {
  return db
    .select({
      id: coachComments.id,
      body: coachComments.body,
      createdAt: coachComments.createdAt,
      readAt: coachComments.readAt,
      sessionId: coachComments.sessionId,
      sessionStartedAt: workoutSessions.startedAt,
      routineName: routines.name,
      authorUsername: author.username,
      authorDisplayName: author.displayName,
    })
    .from(coachComments)
    .leftJoin(author, eq(coachComments.authorId, author.id))
    .leftJoin(workoutSessions, eq(coachComments.sessionId, workoutSessions.id))
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .$dynamic();
}

type CommentRow = Awaited<ReturnType<typeof commentsQuery>>[number];

function toComment(r: CommentRow): CoachComment {
  return {
    id: r.id,
    body: r.body,
    createdAt: r.createdAt,
    readAt: r.readAt,
    sessionId: r.sessionId,
    sessionStartedAt: r.sessionStartedAt,
    routineName: r.routineName,
    authorName:
      r.authorUsername || r.authorDisplayName
        ? publicName({ username: r.authorUsername, displayName: r.authorDisplayName })
        : null,
  };
}

/** Lo que el socio todavía no ha marcado como leído (la tarjeta de Hoy). */
export async function getUnreadComments(userId: string): Promise<CoachComment[]> {
  const rows = await commentsQuery()
    .where(and(eq(coachComments.userId, userId), isNull(coachComments.readAt)))
    .orderBy(desc(coachComments.createdAt))
    .limit(10);
  return rows.map(toComment);
}

/** Los comentarios sobre una sesión, del más viejo al más nuevo. */
export async function getSessionComments(sessionId: string): Promise<CoachComment[]> {
  const rows = await commentsQuery()
    .where(eq(coachComments.sessionId, sessionId))
    .orderBy(asc(coachComments.createdAt));
  return rows.map(toComment);
}

/** Todo lo que el coach le ha escrito a un socio, lo más nuevo primero. */
export async function getMemberComments(userId: string, limit = 20): Promise<CoachComment[]> {
  const rows = await commentsQuery()
    .where(eq(coachComments.userId, userId))
    .orderBy(desc(coachComments.createdAt))
    .limit(limit);
  return rows.map(toComment);
}
