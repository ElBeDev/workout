"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { routines, workoutSessions } from "@/db/schema";
import { requireUserId } from "@/lib/session";

export async function startSession(routineId: string) {
  const userId = await requireUserId();

  const [routine] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  if (!routine) redirect("/rutinas");

  // Resume an unfinished session of this routine instead of stacking a new one.
  const [open] = await db
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutSessions.routineId, routineId),
        isNull(workoutSessions.finishedAt)
      )
    )
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  if (open) redirect(`/entrenar/${open.id}`);

  const [session] = await db
    .insert(workoutSessions)
    .values({ userId, routineId })
    .returning({ id: workoutSessions.id });

  redirect(`/entrenar/${session.id}`);
}

export async function discardSession(sessionId: string) {
  const userId = await requireUserId();
  await db
    .delete(workoutSessions)
    .where(
      and(
        eq(workoutSessions.id, sessionId),
        eq(workoutSessions.userId, userId),
        isNull(workoutSessions.finishedAt)
      )
    );
  revalidatePath("/");
  redirect("/");
}
