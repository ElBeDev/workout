"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { setLogs, workoutSessions } from "@/db/schema";
import { requireUserId } from "@/lib/session";

async function requireOwnedSession(sessionId: string) {
  const userId = await requireUserId();
  const [session] = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));
  if (!session) redirect("/progreso");
}

function revalidateSession(sessionId: string) {
  revalidatePath(`/progreso/sesion/${sessionId}`);
  revalidatePath("/progreso");
}

export async function updateSet(sessionId: string, setId: string, formData: FormData) {
  await requireOwnedSession(sessionId);
  const weightRaw = String(formData.get("weight") ?? "").replace(",", ".").trim();
  const platesRaw = String(formData.get("plates") ?? "").trim();
  const repsRaw = String(formData.get("reps") ?? "").trim();
  const weight = weightRaw !== "" && Number.isFinite(Number(weightRaw)) ? weightRaw : null;
  const plates = platesRaw !== "" && Number.isFinite(Number(platesRaw)) ? Math.round(Number(platesRaw)) : null;
  const reps = repsRaw !== "" && Number.isFinite(Number(repsRaw)) ? Number(repsRaw) : null;

  await db
    .update(setLogs)
    .set({ weight, plates, reps })
    .where(and(eq(setLogs.id, setId), eq(setLogs.sessionId, sessionId)));
  revalidateSession(sessionId);
}

export async function deleteSet(sessionId: string, setId: string) {
  await requireOwnedSession(sessionId);
  await db.delete(setLogs).where(and(eq(setLogs.id, setId), eq(setLogs.sessionId, sessionId)));
  revalidateSession(sessionId);
}
