"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { routines, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

export async function createRoutineForUser(targetUserId: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId));
  if (!target) redirect("/admin");

  const [routine] = await db
    .insert(routines)
    .values({ userId: targetUserId, name })
    .returning({ id: routines.id });

  revalidatePath(`/admin/usuarios/${targetUserId}`);
  redirect(`/rutinas/${routine.id}`);
}
