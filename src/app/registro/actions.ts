"use server";

import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function registerAction(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (username.length < 3 || password.length < 4) {
    redirect("/registro?error=invalid");
  }

  const [existing] = await db.select().from(users).where(eq(users.username, username));
  if (existing) {
    redirect("/registro?error=taken");
  }

  const passwordHash = hashPassword(password);

  // One-time migration path: before real accounts existed, the app ran
  // under a single placeholder row (owner@workout.local). The first
  // person to sign up claims that row instead of starting from zero, so
  // any routines/history created before login existed aren't orphaned.
  const [legacyOwner] = await db
    .select()
    .from(users)
    .where(and(isNull(users.username), eq(users.email, "owner@workout.local")));

  let userId: string;
  if (legacyOwner) {
    await db
      .update(users)
      .set({ username, passwordHash })
      .where(eq(users.id, legacyOwner.id));
    userId = legacyOwner.id;
  } else {
    const [created] = await db
      .insert(users)
      .values({ username, passwordHash })
      .returning({ id: users.id });
    userId = created.id;
  }

  await createSession(userId);
  redirect("/");
}
