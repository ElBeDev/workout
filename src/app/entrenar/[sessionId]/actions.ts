"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { setLogs, workoutSessions } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, eq, max } from "drizzle-orm";

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

export type SyncEntry = {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: string | null;
  reps: number | null;
};

/** Replays sets queued while offline. Returns the entries that were saved. */
export async function syncSets(entries: SyncEntry[]): Promise<SyncEntry[]> {
  const userId = await requireUserId();
  const saved: SyncEntry[] = [];
  const owned = new Set<string>();

  for (const e of entries.slice(0, 200)) {
    if (!owned.has(e.sessionId)) {
      const [s] = await db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.id, e.sessionId), eq(workoutSessions.userId, userId)));
      if (!s) continue;
      owned.add(e.sessionId);
    }
    const weight = e.weight !== null && Number.isFinite(Number(e.weight)) ? String(e.weight) : null;
    const reps = e.reps !== null && Number.isFinite(Number(e.reps)) ? Number(e.reps) : null;
    await db
      .insert(setLogs)
      .values({ sessionId: e.sessionId, exerciseId: e.exerciseId, setNumber: e.setNumber, weight, reps, completed: true })
      .onConflictDoUpdate({
        target: [setLogs.sessionId, setLogs.exerciseId, setLogs.setNumber],
        set: { weight, reps, completed: true, loggedAt: new Date() },
      });
    saved.push(e);
  }

  for (const id of owned) revalidatePath(`/entrenar/${id}`);
  return saved;
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
    .where(eq(workoutSessions.id, sessionId));

  revalidatePath("/");
  redirect("/progreso");
}
