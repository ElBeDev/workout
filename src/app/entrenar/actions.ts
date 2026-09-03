"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
import { requireUserId } from "@/lib/session";

export async function startSession(routineId: string) {
  const userId = await requireUserId();
  const [session] = await db
    .insert(workoutSessions)
    .values({ userId, routineId })
    .returning({ id: workoutSessions.id });

  redirect(`/entrenar/${session.id}`);
}
