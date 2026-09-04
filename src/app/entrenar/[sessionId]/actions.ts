"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { setLogs, workoutSessions } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, eq, isNull, max } from "drizzle-orm";
import { z } from "zod";

async function requireOwnedSession(sessionId: string) {
  const userId = await requireUserId();
  const [session] = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));
  if (!session) redirect("/");
  return session;
}

export async function logSet(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  const exerciseId = String(formData.get("exerciseId"));
  const setNumber = Number(formData.get("setNumber"));
  const weightRaw = formData.get("weight");
  const repsRaw = formData.get("reps");
  const weight =
    weightRaw && String(weightRaw).trim() !== "" ? String(weightRaw) : null;
  const reps =
    repsRaw && String(repsRaw).trim() !== "" ? Number(repsRaw) : null;

  await requireOwnedSession(sessionId);

  await db
    .insert(setLogs)
    .values({ sessionId, exerciseId, setNumber, weight, reps, completed: true })
    .onConflictDoUpdate({
      target: [setLogs.sessionId, setLogs.exerciseId, setLogs.setNumber],
      set: { weight, reps, completed: true, loggedAt: new Date() },
    });

  revalidatePath(`/entrenar/${sessionId}`);
}

const syncEntrySchema = z.object({
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1).max(50),
  weight: z.string().max(10).nullable(),
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
    try {
      await db
        .insert(setLogs)
        .values({ ...key, weight, reps: e.reps, completed: true })
        .onConflictDoUpdate({
          target: [setLogs.sessionId, setLogs.exerciseId, setLogs.setNumber],
          set: { weight, reps: e.reps, completed: true, loggedAt: new Date() },
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
  redirect("/progreso");
}
