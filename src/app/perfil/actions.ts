"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, bodyWeights } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireUserId } from "@/lib/session";

export async function changePasswordAction(formData: FormData) {
  const userId = await requireUserId();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 4) redirect("/perfil?error=short");
  if (next !== confirm) redirect("/perfil?error=mismatch");

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.passwordHash || !verifyPassword(current, user.passwordHash)) {
    redirect("/perfil?error=wrong");
  }

  await db.update(users).set({ passwordHash: hashPassword(next) }).where(eq(users.id, userId));
  redirect("/perfil?ok=password");
}

export async function addBodyWeight(formData: FormData) {
  const userId = await requireUserId();
  const raw = String(formData.get("weight") ?? "").replace(",", ".").trim();
  const weight = Number(raw);
  if (!raw || !Number.isFinite(weight) || weight <= 0 || weight > 500) return;

  await db.insert(bodyWeights).values({ userId, weight: raw });
  revalidatePath("/perfil");
}

export async function deleteBodyWeight(id: string) {
  const userId = await requireUserId();
  await db.delete(bodyWeights).where(and(eq(bodyWeights.id, id), eq(bodyWeights.userId, userId)));
  revalidatePath("/perfil");
}
