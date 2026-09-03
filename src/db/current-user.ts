import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const OWNER_EMAIL = "owner@workout.local";

/**
 * MVP: single-user app, no login screen yet. Ensures one owner row exists
 * and returns its id, so routines/sessions can keep the userId foreign key.
 * Swap for real auth (session lookup) once multi-user login is added.
 */
export async function getCurrentUserId(): Promise<string> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, OWNER_EMAIL),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(users)
    .values({ email: OWNER_EMAIL, name: "Owner" })
    .returning({ id: users.id });
  return created.id;
}
