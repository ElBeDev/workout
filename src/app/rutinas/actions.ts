"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { routines } from "@/db/schema";
import { requireUserId } from "@/lib/session";

export async function createRoutine(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const kind = String(formData.get("kind") ?? "fuerza") === "natacion" ? "natacion" : "fuerza";

  const userId = await requireUserId();
  const [routine] = await db
    .insert(routines)
    .values({ userId, name, kind })
    .returning({ id: routines.id });

  revalidatePath("/rutinas");
  redirect(`/rutinas/${routine.id}`);
}
