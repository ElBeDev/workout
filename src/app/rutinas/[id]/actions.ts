"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { routines, routineExercises, workoutSessions, exercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { mirrorExerciseGif } from "@/lib/blob";
import { and, eq, isNull, or, sql } from "drizzle-orm";

async function requireOwnedRoutine(routineId: string) {
  const userId = await requireUserId();
  const [routine] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  if (!routine) redirect("/rutinas");
  return routine;
}

export async function renameRoutine(routineId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await requireOwnedRoutine(routineId);

  await db.update(routines).set({ name }).where(eq(routines.id, routineId));
  revalidatePath(`/rutinas/${routineId}`);
  revalidatePath("/rutinas");
  revalidatePath("/");
}

export async function setRoutineDays(routineId: string, days: number[]) {
  await requireOwnedRoutine(routineId);
  const clean = Array.from(new Set(days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))).sort();
  await db.update(routines).set({ days: clean }).where(eq(routines.id, routineId));
  revalidatePath(`/rutinas/${routineId}`);
  revalidatePath("/");
}

export async function duplicateRoutine(routineId: string) {
  const userId = await requireUserId();
  const [source] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  if (!source) redirect("/rutinas");

  const [copy] = await db
    .insert(routines)
    .values({ userId, name: `${source.name} (copia)`, days: [] })
    .returning({ id: routines.id });

  const items = await db
    .select()
    .from(routineExercises)
    .where(eq(routineExercises.routineId, routineId));
  if (items.length) {
    await db.insert(routineExercises).values(
      items.map((i) => ({
        routineId: copy.id,
        exerciseId: i.exerciseId,
        sortOrder: i.sortOrder,
        targetSets: i.targetSets,
        targetReps: i.targetReps,
        targetWeight: i.targetWeight,
        restSeconds: i.restSeconds,
        loadUnit: i.loadUnit,
      }))
    );
  }

  revalidatePath("/rutinas");
  redirect(`/rutinas/${copy.id}`);
}

export async function deleteRoutine(routineId: string) {
  await requireOwnedRoutine(routineId);

  // An open session would be stranded (routine_id → null, nothing to render).
  const [open] = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.routineId, routineId), isNull(workoutSessions.finishedAt)))
    .limit(1);
  if (open) redirect(`/rutinas/${routineId}?error=open-session`);

  await db.delete(routines).where(eq(routines.id, routineId));
  revalidatePath("/rutinas");
  revalidatePath("/");
  redirect("/rutinas");
}

function positiveInt(value: FormDataEntryValue | null, fallback: number) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : fallback;
}

export async function addExerciseToRoutine(formData: FormData) {
  const routineId = String(formData.get("routineId"));
  const exerciseId = String(formData.get("exerciseId"));
  const targetSets = positiveInt(formData.get("targetSets"), 2);
  const targetReps = positiveInt(formData.get("targetReps"), 10);
  const targetWeightRaw = formData.get("targetWeight");
  const targetWeight =
    targetWeightRaw && String(targetWeightRaw).trim() !== ""
      ? String(targetWeightRaw)
      : null;
  const loadUnit = String(formData.get("loadUnit") ?? "kg") === "plates" ? "plates" : "kg";

  const userId = await requireUserId();
  await requireOwnedRoutine(routineId);

  // Catalog exercise or one of this user's own — never someone else's custom row.
  const [exercise] = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), or(isNull(exercises.userId), eq(exercises.userId, userId))));
  if (!exercise) return;

  const [{ nextOrder }] = await db
    .select({ nextOrder: sql<number>`coalesce(max(${routineExercises.sortOrder}), -1) + 1` })
    .from(routineExercises)
    .where(eq(routineExercises.routineId, routineId));

  await db.insert(routineExercises).values({
    routineId,
    exerciseId,
    sortOrder: nextOrder,
    targetSets,
    targetReps,
    targetWeight,
    loadUnit,
  });

  // Keep our own copy of the gif now that the exercise is in use (no-op
  // without BLOB_READ_WRITE_TOKEN or if already mirrored).
  await mirrorExerciseGif(exerciseId);

  revalidatePath(`/rutinas/${routineId}`);
}

export async function updateRoutineExercise(
  routineId: string,
  routineExerciseId: string,
  formData: FormData
) {
  await requireOwnedRoutine(routineId);

  const targetSets = Math.max(1, Number(formData.get("targetSets") ?? 1));
  const targetReps = Math.max(1, Number(formData.get("targetReps") ?? 1));
  const targetWeightRaw = formData.get("targetWeight");
  const targetWeight =
    targetWeightRaw && String(targetWeightRaw).trim() !== ""
      ? String(targetWeightRaw)
      : null;
  const restRaw = String(formData.get("restSeconds") ?? "").trim();
  const restSeconds =
    restRaw !== "" && Number.isFinite(Number(restRaw)) && Number(restRaw) > 0
      ? Math.min(900, Math.round(Number(restRaw)))
      : null;

  const loadUnit = String(formData.get("loadUnit") ?? "kg") === "plates" ? "plates" : "kg";

  await db
    .update(routineExercises)
    .set({ targetSets, targetReps, targetWeight, restSeconds, loadUnit })
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(routineExercises.routineId, routineId)
      )
    );

  revalidatePath(`/rutinas/${routineId}`);
}

export async function removeRoutineExercise(routineId: string, routineExerciseId: string) {
  await requireOwnedRoutine(routineId);
  await db
    .delete(routineExercises)
    .where(
      and(
        eq(routineExercises.id, routineExerciseId),
        eq(routineExercises.routineId, routineId)
      )
    );
  revalidatePath(`/rutinas/${routineId}`);
}

export async function moveRoutineExercise(
  routineId: string,
  routineExerciseId: string,
  direction: "up" | "down"
) {
  await requireOwnedRoutine(routineId);

  const items = await db
    .select({ id: routineExercises.id, sortOrder: routineExercises.sortOrder })
    .from(routineExercises)
    .where(eq(routineExercises.routineId, routineId))
    .orderBy(routineExercises.sortOrder);

  const index = items.findIndex((item) => item.id === routineExerciseId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  const current = items[index];
  const swap = items[swapIndex];

  await db
    .update(routineExercises)
    .set({ sortOrder: swap.sortOrder })
    .where(eq(routineExercises.id, current.id));
  await db
    .update(routineExercises)
    .set({ sortOrder: current.sortOrder })
    .where(eq(routineExercises.id, swap.id));

  revalidatePath(`/rutinas/${routineId}`);
}
