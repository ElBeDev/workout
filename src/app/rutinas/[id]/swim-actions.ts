"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { routines, swimBlocks } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { isAdminUser } from "@/lib/admin";

// Mismo criterio que en actions.ts (pendiente consolidar, ver docs/PLAN.md §9.4).
async function requireOwnedRoutine(routineId: string) {
  const userId = await requireUserId();
  const [routine] = await db.select().from(routines).where(eq(routines.id, routineId));
  if (!routine) redirect("/rutinas");
  if (routine.userId !== userId && !(await isAdminUser(userId))) redirect("/rutinas");
  return routine;
}

const LABELS = ["calentamiento", "principal", "patada", "drill", "enfriamiento", "libre"] as const;
const STROKES = ["libre", "dorso", "pecho", "mariposa", "combinado", "patada", "drill"] as const;

function normalizeLabel(v: FormDataEntryValue | null): string {
  const s = String(v ?? "");
  return (LABELS as readonly string[]).includes(s) ? s : "libre";
}

function normalizeStroke(v: FormDataEntryValue | null): string {
  const s = String(v ?? "");
  return (STROKES as readonly string[]).includes(s) ? s : "libre";
}

function positiveInt(value: FormDataEntryValue | null, fallback: number) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : fallback;
}

export async function addSwimBlock(formData: FormData) {
  const routineId = String(formData.get("routineId"));
  const label = normalizeLabel(formData.get("label"));
  const stroke = normalizeStroke(formData.get("stroke"));
  const reps = positiveInt(formData.get("reps"), 4);
  const distanceMeters = positiveInt(formData.get("distanceMeters"), 100);
  const restRaw = String(formData.get("restSeconds") ?? "").trim();
  const restSeconds = restRaw !== "" && Number.isFinite(Number(restRaw)) ? Math.round(Number(restRaw)) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await requireOwnedRoutine(routineId);

  const [{ nextOrder }] = await db
    .select({ nextOrder: sql<number>`coalesce(max(${swimBlocks.sortOrder}), -1) + 1` })
    .from(swimBlocks)
    .where(eq(swimBlocks.routineId, routineId));

  await db.insert(swimBlocks).values({
    routineId,
    sortOrder: nextOrder,
    label,
    stroke,
    reps,
    distanceMeters,
    restSeconds,
    notes,
  });

  revalidatePath(`/rutinas/${routineId}`);
}

export async function updateSwimBlock(routineId: string, blockId: string, formData: FormData) {
  await requireOwnedRoutine(routineId);

  const label = normalizeLabel(formData.get("label"));
  const stroke = normalizeStroke(formData.get("stroke"));
  const reps = positiveInt(formData.get("reps"), 1);
  const distanceMeters = positiveInt(formData.get("distanceMeters"), 25);
  const restRaw = String(formData.get("restSeconds") ?? "").trim();
  const restSeconds = restRaw !== "" && Number.isFinite(Number(restRaw)) ? Math.round(Number(restRaw)) : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db
    .update(swimBlocks)
    .set({ label, stroke, reps, distanceMeters, restSeconds, notes })
    .where(and(eq(swimBlocks.id, blockId), eq(swimBlocks.routineId, routineId)));

  revalidatePath(`/rutinas/${routineId}`);
}

export async function removeSwimBlock(routineId: string, blockId: string) {
  await requireOwnedRoutine(routineId);
  await db
    .delete(swimBlocks)
    .where(and(eq(swimBlocks.id, blockId), eq(swimBlocks.routineId, routineId)));
  revalidatePath(`/rutinas/${routineId}`);
}

export async function moveSwimBlock(routineId: string, blockId: string, direction: "up" | "down") {
  await requireOwnedRoutine(routineId);

  const items = await db
    .select({ id: swimBlocks.id, sortOrder: swimBlocks.sortOrder })
    .from(swimBlocks)
    .where(eq(swimBlocks.routineId, routineId))
    .orderBy(swimBlocks.sortOrder);

  const index = items.findIndex((item) => item.id === blockId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) return;

  const current = items[index];
  const swap = items[swapIndex];

  await db.update(swimBlocks).set({ sortOrder: swap.sortOrder }).where(eq(swimBlocks.id, current.id));
  await db.update(swimBlocks).set({ sortOrder: current.sortOrder }).where(eq(swimBlocks.id, swap.id));

  revalidatePath(`/rutinas/${routineId}`);
}
