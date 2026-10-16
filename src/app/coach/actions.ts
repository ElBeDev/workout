"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { routines, challenges } from "@/db/schema";
import { requireCoach, requireCoachDe } from "@/lib/coach";
import { isMetric } from "@/db/gym";

/** El coach le arma una rutina a uno de sus alumnos; queda como "De tu coach". */
export async function createRoutineForUser(targetUserId: string, formData: FormData) {
  const coachId = await requireCoachDe(targetUserId);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const [routine] = await db
    .insert(routines)
    .values({ userId: targetUserId, name, createdBy: coachId })
    .returning({ id: routines.id });

  revalidatePath(`/coach/usuarios/${targetUserId}`);
  redirect(`/rutinas/${routine.id}`);
}

/**
 * Crea un reto para el grupo del coach (él y sus alumnos). Las fechas llegan de `<input type="date">` como
 * YYYY-MM-DD y se guardan tal cual: son días locales (hora de México), y los
 * bordes en UTC se calculan al leer (`localDayStart`).
 */
export async function createChallenge(formData: FormData) {
  const coachId = await requireCoach();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const metric = String(formData.get("metric") ?? "");
  const startsOn = String(formData.get("startsOn") ?? "");
  const endsOn = String(formData.get("endsOn") ?? "");
  const goalRaw = String(formData.get("goal") ?? "").trim();
  const goal = goalRaw ? Math.round(Number(goalRaw)) : null;

  const ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (!title || !isMetric(metric) || !ymd.test(startsOn) || !ymd.test(endsOn)) return;
  if (endsOn < startsOn) redirect("/coach/retos?error=fechas");
  if (goal !== null && (!Number.isFinite(goal) || goal <= 0 || goal > 100_000_000)) return;

  await db.insert(challenges).values({ title, metric, goal, startsOn, endsOn, createdBy: coachId, coachId });
  revalidatePath("/coach/retos");
  revalidatePath("/retos");
  redirect("/coach/retos");
}

/** Sólo los retos de su propio grupo. */
export async function deleteChallenge(challengeId: string) {
  const coachId = await requireCoach();
  await db.delete(challenges).where(and(eq(challenges.id, challengeId), eq(challenges.coachId, coachId)));
  revalidatePath("/coach/retos");
  revalidatePath("/retos");
}
