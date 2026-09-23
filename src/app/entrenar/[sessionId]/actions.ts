"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { setLogs, workoutSessions, routineExercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, eq, isNull, max } from "drizzle-orm";
import { z } from "zod";
import { getPersonalRecords, recordScore } from "@/db/queries";

async function requireOwnedSession(sessionId: string) {
  const userId = await requireUserId();
  const [session] = await db
    .select({ id: workoutSessions.id, routineId: workoutSessions.routineId })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));
  if (!session) redirect("/");
  return { ...session, userId };
}

/**
 * Cambiar la unidad de carga sin salir del entrenamiento: la máquina en lb o la
 * polea sin kilos marcados se descubren parado enfrente, no armando la rutina.
 * Queda guardada en la rutina, así que la próxima vez ya pide lo correcto. Las
 * series ya registradas conservan su propia `weight_unit` y no se reetiquetan.
 */
export async function setLoadUnit(sessionId: string, exerciseId: string, unit: string) {
  const session = await requireOwnedSession(sessionId);
  const parsed = z.enum(["kg", "lbs", "plates"]).safeParse(unit);
  if (!parsed.success || !session.routineId) return;

  await db
    .update(routineExercises)
    .set({ loadUnit: parsed.data })
    .where(
      and(
        eq(routineExercises.routineId, session.routineId),
        eq(routineExercises.exerciseId, exerciseId)
      )
    );

  revalidatePath(`/entrenar/${sessionId}`);
  revalidatePath(`/rutinas/${session.routineId}`);
}

export type LogSetResult = { isRecord: boolean };

/**
 * Guarda la serie y dice si acaba de romper el récord del ejercicio, para que
 * la fila lo celebre en el momento — que es el único instante en que importa
 * (ver docs/siguiente-ronda.md §5). Sólo cuenta como récord si YA había una
 * marca previa que superar: la primera vez que haces un ejercicio no es "un
 * récord roto", es sólo el primer dato.
 */
export async function logSet(formData: FormData): Promise<LogSetResult> {
  const sessionId = String(formData.get("sessionId"));
  const exerciseId = String(formData.get("exerciseId"));
  const setNumber = Number(formData.get("setNumber"));
  const weightRaw = String(formData.get("weight") ?? "").replace(",", ".").trim();
  const weightUnit = String(formData.get("weightUnit") ?? "kg") === "lbs" ? "lbs" : "kg";
  const platesRaw = String(formData.get("plates") ?? "").trim();
  const repsRaw = String(formData.get("reps") ?? "").trim();
  const weight = weightRaw !== "" && Number.isFinite(Number(weightRaw)) ? weightRaw : null;
  const plates = platesRaw !== "" && Number.isFinite(Number(platesRaw)) ? Math.round(Number(platesRaw)) : null;
  const reps = repsRaw !== "" && Number.isFinite(Number(repsRaw)) ? Number(repsRaw) : null;

  const session = await requireOwnedSession(sessionId);

  // Lo que ya existía justo ANTES de esta escritura. Comparar contra "el
  // estado previo a este cambio" en vez de excluir esta fila a mano también
  // resuelve las ediciones: si subes una serie ya guardada, el punto de
  // comparación es lo que había antes de tocarla, sea o no la misma fila.
  const before = await getPersonalRecords(session.userId);
  const previo = before.get(exerciseId);

  await db
    .insert(setLogs)
    .values({ sessionId, exerciseId, setNumber, weight, weightUnit, plates, reps, completed: true })
    .onConflictDoUpdate({
      target: [setLogs.sessionId, setLogs.exerciseId, setLogs.setNumber],
      set: { weight, weightUnit, plates, reps, completed: true, loggedAt: new Date() },
    });

  revalidatePath(`/entrenar/${sessionId}`);

  let isRecord = false;
  if (previo && reps !== null) {
    const nuevoScore = plates !== null || weight !== null
      ? recordScore({ weight: weight !== null ? Number(weight) : null, weightUnit, plates })
      : null;
    if (nuevoScore !== null) {
      const previoScore = recordScore(previo);
      isRecord = nuevoScore > previoScore || (nuevoScore === previoScore && reps > previo.reps);
    }
  }
  return { isRecord };
}

const syncEntrySchema = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1).max(50),
  weight: z.string().max(10).nullable(),
  weightUnit: z.enum(["kg", "lbs"]).optional(),
  plates: z.number().int().min(0).max(100).nullable().optional(),
  reps: z.number().int().min(0).max(1000).nullable(),
});

export type SyncEntry = z.infer<typeof syncEntrySchema>;
type SyncKey = Pick<SyncEntry, "sessionId" | "exerciseId" | "setNumber">;

/**
 * Replays sets queued while offline. `saved` were written; `rejected` are
 * invalid or belong to a session that no longer exists / isn't the user's —
 * the client should drop both from its queue.
 */
export async function syncSets(
  raw: unknown[]
): Promise<{ saved: SyncKey[]; rejected: SyncKey[] }> {
  const userId = await requireUserId();
  const saved: SyncKey[] = [];
  const rejected: SyncKey[] = [];
  const sessionOk = new Map<string, boolean>();

  for (const item of raw.slice(0, 200)) {
    const parsed = syncEntrySchema.safeParse(item);
    if (!parsed.success) {
      const k = item as Partial<SyncKey>;
      if (k && typeof k.sessionId === "string" && typeof k.exerciseId === "string" && typeof k.setNumber === "number") {
        rejected.push({ sessionId: k.sessionId, exerciseId: k.exerciseId, setNumber: k.setNumber });
      }
      continue;
    }
    const e = parsed.data;
    const key: SyncKey = { sessionId: e.sessionId, exerciseId: e.exerciseId, setNumber: e.setNumber };

    if (!sessionOk.has(e.sessionId)) {
      const [s] = await db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.id, e.sessionId), eq(workoutSessions.userId, userId)));
      sessionOk.set(e.sessionId, Boolean(s));
    }
    if (!sessionOk.get(e.sessionId)) {
      rejected.push(key);
      continue;
    }

    const weight = e.weight !== null && Number.isFinite(Number(e.weight)) ? e.weight : null;
    const weightUnit = e.weightUnit ?? "kg";
    const plates = e.plates ?? null;
    try {
      await db
        .insert(setLogs)
        .values({ ...key, weight, weightUnit, plates, reps: e.reps, completed: true })
        .onConflictDoUpdate({
          target: [setLogs.sessionId, setLogs.exerciseId, setLogs.setNumber],
          set: { weight, weightUnit, plates, reps: e.reps, completed: true, loggedAt: new Date() },
        });
      saved.push(key);
    } catch {
      rejected.push(key);
    }
  }

  for (const [id, ok] of sessionOk) if (ok) revalidatePath(`/entrenar/${id}`);
  return { saved, rejected };
}

export async function addExtraSet(sessionId: string, exerciseId: string, currentCount: number) {
  await requireOwnedSession(sessionId);

  const [{ maxSet }] = await db
    .select({ maxSet: max(setLogs.setNumber) })
    .from(setLogs)
    .where(and(eq(setLogs.sessionId, sessionId), eq(setLogs.exerciseId, exerciseId)));

  const next = Math.max(currentCount, maxSet ?? 0) + 1;
  await db
    .insert(setLogs)
    .values({ sessionId, exerciseId, setNumber: next, completed: false })
    .onConflictDoNothing();

  revalidatePath(`/entrenar/${sessionId}`);
}

export async function saveNotes(sessionId: string, formData: FormData) {
  await requireOwnedSession(sessionId);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  await db.update(workoutSessions).set({ notes }).where(eq(workoutSessions.id, sessionId));
  revalidatePath(`/entrenar/${sessionId}`);
}

export async function finishSession(sessionId: string) {
  await requireOwnedSession(sessionId);
  await db
    .update(workoutSessions)
    .set({ finishedAt: new Date() })
    .where(and(eq(workoutSessions.id, sessionId), isNull(workoutSessions.finishedAt)));

  revalidatePath("/");
  // Al terminar se va al resumen de la sesión (con los anillos de la semana ya
  // actualizados), no a la lista: cerrar un entrenamiento merece su pantalla.
  redirect(`/progreso/sesion/${sessionId}?done=1`);
}
