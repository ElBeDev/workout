"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { coachComments } from "@/db/schema";
import { requireUserId } from "@/lib/session";

/** "Entendido" en la tarjeta de Hoy: marca como leído todo lo que había. */
export async function markCoachCommentsRead() {
  const userId = await requireUserId();
  await db
    .update(coachComments)
    .set({ readAt: new Date() })
    .where(and(eq(coachComments.userId, userId), isNull(coachComments.readAt)));
  revalidatePath("/");
}
