"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

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
  redirect("/");
}
