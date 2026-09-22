import Link from "next/link";
import { eq } from "drizzle-orm";
import { Play, Plus, Dumbbell, ChevronRight, Flame, Timer } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getRoutineSummaries,
  getOpenSession,
  getWeeklyStats,
  getWeeklyRings,
  type RoutineSummary,
} from "@/db/queries";
import { requireUserId } from "@/lib/session";
import { daysAgoLabel, fmtDate, todayWeekday, weekRangeLabel, WEEKDAYS } from "@/lib/dates";
import { fmtKg, fmtNumber } from "@/lib/format";
import { Card, GroupedList, PageHeader, SectionTitle } from "@/components/ui";
import { RingTrio, RingLegend, type RingDatum } from "@/components/Rings";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { DiscardSessionButton } from "@/components/DiscardSessionButton";
import { startSession } from "./entrenar/actions";

export const dynamic = "force-dynamic";

function timeAgo(date: Date) {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} días`;
}

export default async function HomePage() {
  const userId = await requireUserId();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [myRoutines, openSession, weekly, rings] = await Promise.all([
    getRoutineSummaries(userId),
    getOpenSession(userId),
    getWeeklyStats(userId),
    getWeeklyRings(userId, {
      volumeKg: user?.goalWeeklyVolumeKg ?? 5000,
      sets: user?.goalWeeklySets ?? 60,
      days: user?.goalWeeklyDays ?? 4,
    }),
  ]);

  const today = todayWeekday();
  const todayName = WEEKDAYS.find((d) => d.value === today)?.long ?? "";
  const planned = myRoutines.filter((r) => r.days.includes(today));
  const others = myRoutines.filter((r) => !r.days.includes(today));

  const volume = fmtKg(rings.volumeKg);
  const goalVolume = fmtKg(rings.volumeGoal);
  const ringData: RingDatum[] = [
    {
      tone: "load",
      // La unidad va en la etiqueta: "7,200/5,000 kg" no cabe en la leyenda.
      label: `Carga (${volume.unit})`,
      value: rings.volumeKg,
      goal: rings.volumeGoal,
      display: `${volume.value}/${goalVolume.value}`,
    },
    {
      tone: "sets",
      label: "Series",
      value: rings.sets,
      goal: rings.setsGoal,
      display: `${fmtNumber(rings.sets)}/${fmtNumber(rings.setsGoal)}`,
    },
    {
      tone: "days",
      label: "Días",
      value: rings.days,
      goal: rings.daysGoal,
      display: `${rings.days}/${rings.daysGoal}`,
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow={fmtDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}
        title="Resumen"
        right={
          <Link
            href="/perfil"
            aria-label="Perfil"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-[17px] font-bold uppercase text-muted"
          >
            {(user?.username ?? "?").slice(0, 1)}
          </Link>
        }
      />

      <Card hero className="p-5">
        <div className="flex items-center gap-5">
          <RingTrio data={ringData} size={148} />
          <RingLegend data={ringData} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-[13px] text-muted">{weekRangeLabel()}</p>
          {weekly.streakWeeks >= 2 ? (
            <p className="inline-flex items-center gap-1 text-[13px] font-semibold text-load">
              <Flame className="h-4 w-4" />
              {weekly.streakWeeks} semanas seguidas
            </p>
          ) : (
            <p className="text-[13px] font-semibold text-muted">
              {Math.round(Math.min(rings.overall, 9.99) * 100)} % de tus metas
            </p>
          )}
        </div>
      </Card>

      {openSession && (
        <Card className="border-accent/40 p-4">
          <div className="flex items-center gap-3">
            <span className="animate-dot h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
            <p className="label text-accent">En curso</p>
            <p className="ml-auto inline-flex items-center gap-1 text-[13px] font-semibold text-muted">
              <Timer className="h-3.5 w-3.5" />
              {timeAgo(openSession.startedAt)}
            </p>
          </div>
          <p className="mt-2 truncate text-[22px] font-bold tracking-[-0.02em]">
            {openSession.routineName ?? "Rutina eliminada"}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Link
              href={`/entrenar/${openSession.id}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent text-[17px] font-semibold text-accent-foreground transition active:scale-[0.98]"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Continuar
            </Link>
            <DiscardSessionButton sessionId={openSession.id} compact />
          </div>
        </Card>
      )}

      {myRoutines.length === 0 ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>Tus rutinas</SectionTitle>
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
              <Dumbbell className="h-6 w-6" />
            </div>
            <p className="text-[15px] text-muted">
              Todavía no tienes rutinas. Crea la primera para empezar.
            </p>
            <Link
              href="/rutinas"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-accent px-5 text-[15px] font-semibold text-accent-foreground"
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
              <div className="flex flex-col gap-3">
                {planned.map((routine) => (
                  <TodayCard key={routine.id} routine={routine} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <SectionTitle>{planned.length > 0 ? "Otras rutinas" : "Tus rutinas"}</SectionTitle>
                <Link href="/rutinas" className="text-[13px] font-semibold text-accent">
                  Ver todas
                </Link>
              </div>
              <GroupedList>
                {others.map((routine) => (
                  <Link
                    key={routine.id}
                    href={`/rutinas/${routine.id}`}
                    className="flex items-center gap-3 p-3 transition active:bg-surface-2"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                      <ExerciseThumb src={routine.thumbUrl} alt={routine.name} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[17px] font-semibold">{routine.name}</p>
                      <p className="text-[13px] text-muted">
                        {routine.exerciseCount} ejercicios · {routine.totalSets} series
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
                  </Link>
                ))}
              </GroupedList>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** Tarjeta grande de la rutina del día: el CTA principal de la pantalla. */
function TodayCard({ routine }: { routine: RoutineSummary }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <Link href={`/rutinas/${routine.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <ExerciseThumb src={routine.thumbUrl} alt={routine.name} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[20px] font-bold tracking-[-0.02em]">{routine.name}</p>
            <p className="text-[13px] text-muted">
              {routine.exerciseCount} ejercicios · {routine.totalSets} series
            </p>
            <p className="text-[13px] text-faint">{daysAgoLabel(routine.lastDoneAt)}</p>
          </div>
        </Link>
        <form action={startSession.bind(null, routine.id)}>
          <button
            type="submit"
            aria-label={`Empezar ${routine.name}`}
            disabled={routine.exerciseCount === 0}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition active:scale-95 disabled:opacity-30"
          >
            <Play className="h-5 w-5" fill="currentColor" />
          </button>
        </form>
      </div>
    </Card>
  );
}
