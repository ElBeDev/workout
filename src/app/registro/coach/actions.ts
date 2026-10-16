"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createSession, getCurrentUserId } from "@/lib/session";
import { crearCoach } from "@/server/coaches";

// Mismas reglas que el registro normal (src/app/registro/actions.ts).
const USERNAME_RE = /^[a-z0-9._@-]{3,40}$/;

function texto(formData: FormData, campo: string, max: number): string | null {
  return String(formData.get(campo) ?? "").trim().slice(0, max) || null;
}

/**
 * Alta de coach (docs/coaches.md §4.1 y §4.5). Sin sesión crea la cuenta; con
 * sesión convierte la que ya tiene, con todo su historial. En el paso 5 aquí
 * se mete Stripe Checkout antes de entrar al panel.
 */
export async function registrarCoach(formData: FormData) {
  const brandName = texto(formData, "brandName", 60);
  let userId = await getCurrentUserId();

  if (!userId) {
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const displayName = texto(formData, "displayName", 40);
    if (!USERNAME_RE.test(username) || password.length < 4 || password.length > 128) {
      redirect("/registro/coach?error=invalid");
    }
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
    if (existing) redirect("/registro/coach?error=taken");
    try {
      const [created] = await db
        .insert(users)
        .values({ username, passwordHash: hashPassword(password), displayName })
        .returning({ id: users.id });
      userId = created.id;
    } catch {
      // Perdió la carrera contra el índice único.
      redirect("/registro/coach?error=taken");
    }
    await createSession(userId);
  }

  const r = await crearCoach(userId, { brandName });
  if (!r.ok && r.error !== "ya_es_coach") redirect(`/registro/coach?error=${r.error}`);
  revalidatePath("/", "layout");
  redirect("/coach");
}
