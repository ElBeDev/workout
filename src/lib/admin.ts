import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUserId } from "@/lib/session";

export async function isAdminUser(userId: string): Promise<boolean> {
  const [row] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId));
  return row?.isAdmin ?? false;
}

/** Redirects to Home if the logged-in user isn't an admin. */
export async function requireAdmin(): Promise<string> {
  const userId = await requireUserId();
  if (!(await isAdminUser(userId))) redirect("/");
  return userId;
}
