import Link from "next/link";
import { ChevronRight, CalendarClock, CalendarDays } from "lucide-react";
import { TrainingHeatmap } from "@/components/TrainingHeatmap";
import { fmtDate } from "@/lib/dates";
import { db } from "@/db";
import { workoutSessions, routines, setLogs, exercises } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { requireUserId } from "@/lib/session";
import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { bodyPartLabel } from "@/lib/body-parts";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";

export const dynamic = "force-dynamic";

export default async function ProgresoPage() {
  const userId = await requireUserId();

  const sessions = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      routineName: routines.name,
    })
    .from(workoutSessions)
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(and(eq(workoutSessions.userId, userId), isNotNull(workoutSessions.finishedAt)))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(30);

  const since = new Date();
  since.setDate(since.getDate() - 16 * 7);
  const heatDates = await db
    .select({ startedAt: workoutSessions.startedAt })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNotNull(workoutSessions.finishedAt),
        gte(workoutSessions.startedAt, since)
      )
    );

  const trainedExercises = await db
    .selectDistinct({
      id: exercises.id,
      name: exercises.name,
      nameEs: exercises.nameEs,
      bodyPart: exercises.bodyPart,
      gifUrl: exerciseGif,
    })
    .from(setLogs)
    .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
    .where(and(eq(workoutSessions.userId, userId), eq(setLogs.completed, true)))
    .orderBy(exercises.name);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Progreso"
        subtitle={
          sessions.length === 1
            ? "1 sesión completada"
            : `${sessions.length} sesiones completadas`
        }
      />

      {sessions.length > 0 && (
        <Card className="p-4">
          <SectionTitle className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted" /> Días entrenados
          </SectionTitle>
          <TrainingHeatmap sessionDates={heatDates.map((h) => h.startedAt)} />
        </Card>
      )}

      {trainedExercises.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Por ejercicio</SectionTitle>
          <ul className="flex flex-col gap-3">
            {trainedExercises.map((ex) => (
              <li key={ex.id}>
                <Link href={`/progreso/${ex.id}`}>
                  <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                      <ExerciseThumb src={ex.gifUrl} alt={ex.nameEs ?? ex.name} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold capitalize">{ex.nameEs ?? ex.name}</p>
                      <p className="text-[13px] text-muted">{bodyPartLabel(ex.bodyPart)}</p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>Sesiones</SectionTitle>
        {sessions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted">
              Todavía no tienes sesiones registradas. Termina un entrenamiento
              para verlo aquí.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link href={`/progreso/sesion/${s.id}`}>
                  <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[15px] font-semibold ${s.routineName ? "" : "text-muted"}`}>
                        {s.routineName ?? "Rutina eliminada"}
                      </p>
                      <p className="text-[13px] text-muted">
                        {fmtDate(s.startedAt, { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
