"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { tomarInvitacion } from "@/lib/invitacion";

const MAX_FAILED = 8;
const LOCK_MINUTES = 15;

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "").slice(0, 128);

  const [user] = await db.select().from(users).where(eq(users.username, username));

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    redirect("/login?error=locked");
  }

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    if (user) {
      const failed = user.failedLogins + 1;
      const lock = failed >= MAX_FAILED;
      await db
        .update(users)
        .set({
          failedLogins: lock ? 0 : failed,
          lockedUntil: lock ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        })
        .where(eq(users.id, user.id));
      if (lock) redirect("/login?error=locked");
    }
    redirect("/login?error=invalid");
  }

  if (user.failedLogins > 0 || user.lockedUntil) {
    await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  }

  await createSession(user.id);

  // Venía de la liga de un coach: de vuelta a ella, ya con sesión, para que
  // confirme (si ya tiene coach, ahí se le pregunta si lo cambia).
  const invitacion = await tomarInvitacion();
  if (invitacion) redirect(`/unirse/${encodeURIComponent(invitacion)}`);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
