"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, pushSubscriptions } from "@/db/schema";
import { requireUserId } from "@/lib/session";

const suscripcionSchema = z.object({
  endpoint: z.string().url().max(600),
  p256dh: z.string().min(10).max(200),
  auth: z.string().min(5).max(100),
});

/** Guarda (o refresca) la suscripción de este dispositivo. */
export async function guardarSuscripcion(raw: unknown) {
  const userId = await requireUserId();
  const parsed = suscripcionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const };

  await db
    .insert(pushSubscriptions)
    .values({ userId, ...parsed.data })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      // Reasignar el usuario a propósito: en un teléfono compartido, el
      // endpoint es del navegador, no de la cuenta.
      set: { userId, p256dh: parsed.data.p256dh, auth: parsed.data.auth },
    });

  await db.update(users).set({ reminderEnabled: true }).where(eq(users.id, userId));
  revalidatePath("/perfil");
  return { ok: true as const };
}

export async function borrarSuscripcion(endpoint: string) {
  const userId = await requireUserId();
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  await db.update(users).set({ reminderEnabled: false }).where(eq(users.id, userId));
  revalidatePath("/perfil");
}

export async function setHoraRecordatorio(hora: number) {
  const userId = await requireUserId();
  const h = Math.min(Math.max(Math.round(hora), 0), 23);
  await db.update(users).set({ reminderHour: h }).where(eq(users.id, userId));
  revalidatePath("/perfil");
}

/** Manda un aviso de prueba a este dispositivo, para no esperar hasta mañana. */
export async function probarAviso() {
  const userId = await requireUserId();
  const { enviarAviso } = await import("@/lib/push");
  const [u] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId));
  return enviarAviso(userId, {
    titulo: "FiTME",
    cuerpo: `Así se va a ver tu recordatorio, ${u?.username ?? ""}.`.trim(),
    url: "/",
  });
}
