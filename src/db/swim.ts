import { and, asc, eq, gte, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { routines, workoutSessions, swimBlocks, swimBlockLogs } from "@/db/schema";
import { fmtPace100 } from "@/lib/format";

export type SwimBlock = {
  id: string;
  sortOrder: number;
  label: string;
  stroke: string;
  reps: number;
  distanceMeters: number;
  restSeconds: number | null;
  notes: string | null;
};

/** El plan de una rutina de natación, en orden. */
export async function getSwimBlocks(routineId: string): Promise<SwimBlock[]> {
  return db
    .select({
      id: swimBlocks.id,
      sortOrder: swimBlocks.sortOrder,
      label: swimBlocks.label,
      stroke: swimBlocks.stroke,
      reps: swimBlocks.reps,
      distanceMeters: swimBlocks.distanceMeters,
      restSeconds: swimBlocks.restSeconds,
      notes: swimBlocks.notes,
    })
    .from(swimBlocks)
    .where(eq(swimBlocks.routineId, routineId))
    .orderBy(asc(swimBlocks.sortOrder));
}

export type SwimBlockLog = {
  swimBlockId: string | null;
  completed: boolean;
  actualDistanceMeters: number | null;
};

/** Lo que ya se marcó de una sesión de natación en curso, por bloque. */
export async function getSwimBlockLogs(sessionId: string): Promise<Map<string, SwimBlockLog>> {
  const rows = await db
    .select({
      swimBlockId: swimBlockLogs.swimBlockId,
      completed: swimBlockLogs.completed,
      actualDistanceMeters: swimBlockLogs.actualDistanceMeters,
    })
    .from(swimBlockLogs)
    .where(eq(swimBlockLogs.sessionId, sessionId));
  return new Map(
    rows.filter((r): r is SwimBlockLog & { swimBlockId: string } => r.swimBlockId !== null).map((r) => [r.swimBlockId, r])
  );
}

/** Distancia planeada de un bloque (repeticiones × distancia por repetición). */
export function plannedDistance(block: Pick<SwimBlock, "reps" | "distanceMeters">): number {
  return block.reps * block.distanceMeters;
}

export type SwimSessionBlock = {
  logId: string;
  swimBlockId: string | null;
  completed: boolean;
  actualDistanceMeters: number | null;
  // null si el bloque planeado ya se borró — el log de lo nadado se conserva igual.
  label: string | null;
  stroke: string | null;
  reps: number | null;
  distanceMeters: number | null;
  sortOrder: number | null;
};

/** Bloques logueados de una sesión ya terminada, para el detalle de Progreso. */
export async function getSwimSessionBlocks(sessionId: string): Promise<SwimSessionBlock[]> {
  return db
    .select({
      logId: swimBlockLogs.id,
      swimBlockId: swimBlockLogs.swimBlockId,
      completed: swimBlockLogs.completed,
      actualDistanceMeters: swimBlockLogs.actualDistanceMeters,
      label: swimBlocks.label,
      stroke: swimBlocks.stroke,
      reps: swimBlocks.reps,
      distanceMeters: swimBlocks.distanceMeters,
      sortOrder: swimBlocks.sortOrder,
    })
    .from(swimBlockLogs)
    .leftJoin(swimBlocks, eq(swimBlockLogs.swimBlockId, swimBlocks.id))
    .where(and(eq(swimBlockLogs.sessionId, sessionId), eq(swimBlockLogs.completed, true)))
    .orderBy(asc(swimBlocks.sortOrder));
}

/** Distancia total (m) y duración (min) de una sesión de natación ya terminada. */
export async function getSwimSessionTotals(
  sessionId: string
): Promise<{ distanceMeters: number; blocksDone: number }> {
  const rows = await db
    .select({ actualDistanceMeters: swimBlockLogs.actualDistanceMeters })
    .from(swimBlockLogs)
    .where(and(eq(swimBlockLogs.sessionId, sessionId), eq(swimBlockLogs.completed, true)));
  return {
    distanceMeters: rows.reduce((sum, r) => sum + (r.actualDistanceMeters ?? 0), 0),
    blocksDone: rows.length,
  };
}

export type SwimStats = {
  sessions: number;
  distanceMeters: number;
  minutes: number;
  /** "1:45" (min:seg por 100 m), o null si no hay distancia u tiempo con qué calcularlo. */
  pace: string | null;
};

/** Totales de natación del periodo, para la tarjeta de Progreso. */
export async function getSwimStats(userId: string, days: number): Promise<SwimStats> {
  const since = new Date(Date.now() - days * 86400000);
  const sessionRows = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
    })
    .from(workoutSessions)
    .innerJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(routines.kind, "natacion"),
        isNotNull(workoutSessions.finishedAt),
        gte(workoutSessions.startedAt, since)
      )
    );
  if (sessionRows.length === 0) return { sessions: 0, distanceMeters: 0, minutes: 0, pace: null };

  const logs = await db
    .select({ sessionId: swimBlockLogs.sessionId, actualDistanceMeters: swimBlockLogs.actualDistanceMeters })
    .from(swimBlockLogs)
    .where(
      and(
        inArray(swimBlockLogs.sessionId, sessionRows.map((r) => r.id)),
        eq(swimBlockLogs.completed, true)
      )
    );

  const distanceBySession = new Map<string, number>();
  for (const l of logs) {
    distanceBySession.set(
      l.sessionId,
      (distanceBySession.get(l.sessionId) ?? 0) + (l.actualDistanceMeters ?? 0)
    );
  }

  let distanceMeters = 0;
  let minutes = 0;
  for (const s of sessionRows) {
    distanceMeters += distanceBySession.get(s.id) ?? 0;
    minutes += Math.max(0, Math.round((s.finishedAt!.getTime() - s.startedAt.getTime()) / 60000));
  }

  return {
    sessions: sessionRows.length,
    distanceMeters: Math.round(distanceMeters),
    minutes,
    pace: minutes > 0 ? fmtPace100(distanceMeters, minutes * 60) : null,
  };
}
