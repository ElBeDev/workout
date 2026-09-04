import Link from "next/link";
import { eq } from "drizzle-orm";
import { Play, Plus, Dumbbell, Layers, User, Timer, Flame, CalendarCheck, History } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getRoutineSummaries, getOpenSession, getWeeklyStats, type RoutineSummary } from "@/db/queries";
import { requireUserId } from "@/lib/session";
import { daysAgoLabel, todayWeekday, WEEKDAYS } from "@/lib/dates";
import { Card, SectionTitle, CircleButton } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { DiscardSessionButton } from "@/components/DiscardSessionButton";
import { startSession } from "./entrenar/actions";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} días`;
}

export default async function HomePage() {
  const userId = await requireUserId();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [myRoutines, openSession, weekly] = await Promise.all([
    getRoutineSummaries(userId),
    getOpenSession(userId),
    getWeeklyStats(userId),
  ]);

  const today = todayWeekday();
  const todayName = WEEKDAYS.find((d) => d.value === today)?.long ?? "";
  const planned = myRoutines.filter((r) => r.days.includes(today));
  const others = myRoutines.filter((r) => !r.days.includes(today));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Hola,</p>
          <h1 className="text-[26px] font-bold leading-tight tracking-tight capitalize">
            {user?.username ?? "tú"}
          </h1>
        </div>
        <Link
          href="/perfil"
          aria-label="Perfil"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-[0_2px_12px_rgba(21,21,31,0.06)]"
        >
          <User className="h-5 w-5" />
        </Link>
      </header>

      {openSession && (
        <div className="flex flex-col gap-3 rounded-[1.5rem] bg-accent p-4 text-accent-foreground shadow-[0_10px_30px_rgba(21,21,31,0.10)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface/70 text-foreground">
              <Timer className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] opacity-70">Entrenamiento en curso</p>
              <p className="truncate text-[16px] font-semibold">
                {openSession.routineName ?? "Rutina eliminada"}
                <span className="font-normal opacity-70"> · {timeAgo(openSession.startedAt)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <DiscardSessionButton sessionId={openSession.id} compact />
            <Link
              href={`/entrenar/${openSession.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[14px] font-semibold text-primary-foreground"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Continuar
            </Link>
          </div>
        </div>
      )}

      {myRoutines.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[20px] font-bold leading-none tabular-nums">{weekly.thisWeek}</p>
              <p className="text-[11px] text-muted">esta semana</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[20px] font-bold leading-none tabular-nums">{weekly.streakWeeks}</p>
              <p className="text-[11px] text-muted">
                {weekly.streakWeeks === 1 ? "semana seguida" : "semanas seguidas"}
              </p>
            </div>
          </Card>
        </div>
      )}

      {myRoutines.length === 0 ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>Tus rutinas</SectionTitle>
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Dumbbell className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted">
              Todavía no tienes rutinas. Crea la primera para empezar.
            </p>
            <Link
              href="/rutinas"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              Crear rutina
            </Link>
          </Card>
        </section>
      ) : (
        <>
          {planned.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Hoy toca · {todayName}</SectionTitle>
              <RoutineList routines={planned} />
            </section>
          )}
          {others.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <SectionTitle>{planned.length > 0 ? "Otras rutinas" : "Tus rutinas"}</SectionTitle>
                <Link href="/rutinas" className="text-sm font-medium text-muted">
                  Ver todas
                </Link>
              </div>
              <RoutineList routines={others} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function RoutineList({ routines }: { routines: RoutineSummary[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {routines.map((routine) => (
        <li key={routine.id}>
          <Card className="flex items-center gap-3 p-3">
            <Link href={`/rutinas/${routine.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-18 w-18 shrink-0 overflow-hidden rounded-2xl">
                <ExerciseThumb src={routine.thumbUrl} alt={routine.name} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold">{routine.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" />
                    {routine.exerciseCount} ejercicios
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {routine.totalSets} series
                  </span>
                </div>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-muted/80">
                  <History className="h-3 w-3" />
                  {daysAgoLabel(routine.lastDoneAt)}
                </p>
              </div>
            </Link>
            <form action={startSession.bind(null, routine.id)}>
              <CircleButton
                type="submit"
                tone="dark"
                aria-label={`Empezar ${routine.name}`}
                disabled={routine.exerciseCount === 0}
              >
                <Play className="h-4 w-4" fill="currentColor" />
              </CircleButton>
            </form>
          </Card>
        </li>
      ))}
    </ul>
  );
}
