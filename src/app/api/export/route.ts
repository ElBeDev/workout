import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { setLogs, workoutSessions, routines, exercises } from "@/db/schema";
import { getCurrentUserId } from "@/lib/session";
import { APP_TIME_ZONE } from "@/lib/dates";

function csvCell(value: string | number | null | undefined) {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return new NextResponse("No autorizado", { status: 401 });

  const rows = await db
    .select({
      startedAt: workoutSessions.startedAt,
      routine: routines.name,
      exercise: exercises.name,
      exerciseEs: exercises.nameEs,
      setNumber: setLogs.setNumber,
      weight: setLogs.weight,
      reps: setLogs.reps,
      notes: workoutSessions.notes,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
    .where(eq(workoutSessions.userId, userId))
    .orderBy(asc(workoutSessions.startedAt), asc(exercises.name), asc(setLogs.setNumber));

  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  });

  const header = ["fecha", "rutina", "ejercicio", "ejercicio_en", "serie", "kg", "reps", "notas"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        fmt.format(r.startedAt),
        r.routine ?? "",
        r.exerciseEs ?? r.exercise,
        r.exercise,
        r.setNumber,
        r.weight ?? "",
        r.reps ?? "",
        r.notes ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="workout-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
