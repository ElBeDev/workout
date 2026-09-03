"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { routines, routineExercises } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { and, eq, sql } from "drizzle-orm";

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

export async function deleteRoutine(routineId: string) {
  await requireOwnedRoutine(routineId);
  await db.delete(routines).where(eq(routines.id, routineId));
  revalidatePath("/rutinas");
  revalidatePath("/");
  redirect("/rutinas");
}

export async function addExerciseToRoutine(formData: FormData) {
  const routineId = String(formData.get("routineId"));
  const exerciseId = String(formData.get("exerciseId"));
  const targetSets = Number(formData.get("targetSets") ?? 3);
  const targetReps = Number(formData.get("targetReps") ?? 10);
  const targetWeightRaw = formData.get("targetWeight");
  const targetWeight =
    targetWeightRaw && String(targetWeightRaw).trim() !== ""
      ? String(targetWeightRaw)
      : null;

  await requireOwnedRoutine(routineId);

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
  });

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
