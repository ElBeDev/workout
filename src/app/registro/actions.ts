"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { tomarInvitacion } from "@/lib/invitacion";
import { mandarAvisos } from "@/lib/avisos";
import { ligarConCodigo } from "@/server/vinculos";

const USERNAME_RE = /^[a-z0-9._@-]{3,40}$/;

export async function registerAction(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_RE.test(username) || password.length < 4 || password.length > 128) {
    redirect("/registro?error=invalid");
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (existing) redirect("/registro?error=taken");

  let userId: string;
  try {
    const [created] = await db
      .insert(users)
      .values({ username, passwordHash: hashPassword(password) })
      .returning({ id: users.id });
    userId = created.id;
  } catch {
    // Lost a race on the unique index.
    redirect("/registro?error=taken");
  }

  await createSession(userId);

  // Llegó por la liga de un coach (/unirse/[code]): queda en su grupo de una
  // vez, porque una cuenta nueva no tiene coach que cambiar (docs/coaches.md §4.5).
  const invitacion = await tomarInvitacion();
  if (invitacion) {
    const r = await ligarConCodigo(userId, invitacion, { source: "link" });
    mandarAvisos(r.avisos);
    if (!r.ok) redirect(`/unirse/${encodeURIComponent(invitacion)}?error=${r.error}`);
  }
  redirect("/");
}
