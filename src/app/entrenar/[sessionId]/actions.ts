"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { setLogs, workoutSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  await db
    .insert(setLogs)
    .values({ sessionId, exerciseId, setNumber, weight, reps, completed: true })
    .onConflictDoUpdate({
      target: [setLogs.sessionId, setLogs.exerciseId, setLogs.setNumber],
      set: { weight, reps, completed: true, loggedAt: new Date() },
    });

  revalidatePath(`/entrenar/${sessionId}`);
}

export async function finishSession(sessionId: string) {
  await db
    .update(workoutSessions)
    .set({ finishedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId));

  redirect("/progreso");
}
