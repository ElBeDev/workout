"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { routines } from "@/db/schema";
import { getCurrentUserId } from "@/db/current-user";
import { eq } from "drizzle-orm";

export async function createRoutine(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const userId = await getCurrentUserId();
  const [routine] = await db
    .insert(routines)
    .values({ userId, name })
    .returning({ id: routines.id });

  revalidatePath("/rutinas");
  redirect(`/rutinas/${routine.id}`);
}

export async function deleteRoutine(routineId: string) {
  await db.delete(routines).where(eq(routines.id, routineId));
  revalidatePath("/rutinas");
}
