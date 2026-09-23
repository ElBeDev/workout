import Link from "next/link";
import { eq } from "drizzle-orm";
import { ChevronRight, Trophy } from "lucide-react";
import { db } from "@/db";
import { users, workoutSessions, setLogs, exercises } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { and } from "drizzle-orm";
import { requireUserId } from "@/lib/session";
import { fmtDate } from "@/lib/dates";
import { fmtKg, fmtMinutes, fmtMinutesShort, fmtNumber } from "@/lib/format";
import { loadLabel } from "@/lib/suggest";
import { bodyPartLabel } from "@/lib/body-parts";
import {
  getPeriodStats,
  getDailyTraining,
  getPersonalRecords,
  getSessionSummaries,
} from "@/db/queries";
import { getDict } from "@/i18n";
import { ConsistencyCalendar } from "@/components/ConsistencyCalendar";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import {
  Card,
  GroupedList,
  MetricTile,
  PageHeader,
  SectionTitle,
  StatGrid,
  TrendPill,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const RANGES = [
  { days: 7, label: "rangoSemana" },
  { days: 30, label: "rangoMes" },
  { days: 365, label: "rangoAnio" },
] as const;

export default async function ProgresoPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const userId = await requireUserId();
  const t = await getDict();
  const { r } = await searchParams;
  const range = RANGES.find((x) => String(x.days) === r) ?? RANGES[1];

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const goals = {
    volumeKg: user?.goalWeeklyVolumeKg ?? 5000,
    sets: user?.goalWeeklySets ?? 60,
    days: user?.goalWeeklyDays ?? 4,
  };

  const [stats, byDay, records, sessions, trainedExercises] = await Promise.all([
    getPeriodStats(userId, range.days),
    getDailyTraining(userId, 16 * 7),
    getPersonalRecords(userId),
    getSessionSummaries(userId, 30),
    db
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
      .orderBy(exercises.name),
  ]);

  const volume = fmtKg(stats.volumeKg, t.comun.intl);
  const trendUp = (stats.volumeTrendPct ?? 0) > 0;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title={t.progreso.titulo} />

      <div className="flex gap-1 rounded-full bg-surface-2 p-1">
        {RANGES.map((option) => {
          const active = option.days === range.days;
          return (
            <Link
              key={option.days}
              href={`/progreso?r=${option.days}`}
              scroll={false}
              className={`flex-1 rounded-full py-2 text-center text-[13px] font-semibold transition ${
                active ? "bg-surface text-foreground shadow-hero" : "text-muted"
              }`}
            >
              {t.progreso[option.label]}
            </Link>
          );
        })}
      </div>

      <Card hero className="p-5">
        <p className="label text-load">{t.progreso.tendenciaDeCarga}</p>
        <div className="mt-1 flex items-baseline gap-3">
          <p className="text-[34px] font-bold leading-none tracking-[-0.02em]">
            {stats.volumeTrendPct === null
              ? "—"
              : t.progreso.porcentajeTendencia(Math.round(stats.volumeTrendPct))}
          </p>
          {stats.volumeTrendPct !== null && (
            <TrendPill pct={stats.setsTrendPct} label={t.progreso.tendenciaSeries} />
          )}
        </div>
        <p className="mt-2 text-[15px] text-muted">
          {stats.volumeTrendPct === null
            ? t.progreso.tendenciaSinComparacion(range.days)
            : trendUp
              ? t.progreso.tendenciaSubio(Math.round(stats.volumeTrendPct), range.days)
              : t.progreso.tendenciaBajo(
                  Math.abs(Math.round(stats.volumeTrendPct)),
                  range.days
                )}
        </p>
      </Card>

      <StatGrid>
        <MetricTile label={t.progreso.metricaSesiones} value={fmtNumber(stats.sessions, t.comun.intl)} tone="days" />
        <MetricTile label={t.progreso.metricaSeries} value={fmtNumber(stats.sets, t.comun.intl)} tone="sets" />
        <MetricTile
          label={t.progreso.metricaCarga}
          value={volume.value}
          unit={volume.unit}
          tone="load"
        />
        <MetricTile label={t.progreso.metricaTiempo} value={fmtMinutesShort(stats.minutes)} />
      </StatGrid>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.progreso.diasEntrenados}</SectionTitle>
        <Card className="p-4">
          <ConsistencyCalendar byDay={byDay} goals={goals} />
        </Card>
      </section>

      {trainedExercises.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.progreso.porEjercicio}</SectionTitle>
          <GroupedList>
            {trainedExercises.map((ex) => {
              const pr = records.get(ex.id);
              const prLabel = pr
                ? (loadLabel(pr.weight, pr.plates, pr.weightUnit) ?? t.progreso.reps(pr.reps))
                : null;
              return (
                <Link
                  key={ex.id}
                  href={`/progreso/${ex.id}`}
                  className="flex items-center gap-3 p-3 transition active:bg-surface-2"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <ExerciseThumb
                      src={ex.gifUrl}
                      alt={ex.nameEs ?? ex.name}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[17px] font-semibold capitalize leading-snug">
                      {ex.nameEs ?? ex.name}
                    </p>
                    <p className="flex items-center gap-1.5 text-[13px] text-muted">
                      {prLabel ? (
                        <>
                          <Trophy className="h-3.5 w-3.5 text-load" />
                          <span className="font-semibold text-load">{prLabel}</span>
                          <span className="text-faint">·</span>
                        </>
                      ) : null}
                      {bodyPartLabel(ex.bodyPart)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
                </Link>
              );
            })}
          </GroupedList>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.progreso.sesiones}</SectionTitle>
        {sessions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-[15px] text-muted">{t.progreso.sinSesiones}</p>
          </Card>
        ) : (
          <GroupedList>
            {sessions.map((s) => {
              const vol = fmtKg(s.volumeKg, t.comun.intl);
              return (
                <Link
                  key={s.id}
                  href={`/progreso/sesion/${s.id}`}
                  className="flex items-center gap-3 p-3.5 transition active:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[17px] font-semibold ${
                        s.routineName ? "" : "text-muted"
                      }`}
                    >
                      {s.routineName ?? t.progreso.rutinaEliminada}
                    </p>
                    <p className="text-[13px] text-muted">
                      {fmtDate(s.startedAt, { dateStyle: "medium" }, t.comun.intl)} · {fmtMinutes(s.minutes)}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-[13px]">
                      <span className="font-semibold text-sets">{t.progreso.series(s.sets)}</span>
                      {s.volumeKg > 0 && (
                        <span className="font-semibold text-load">
                          {vol.value} {vol.unit}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
                </Link>
              );
            })}
          </GroupedList>
        )}
      </section>
    </div>
  );
}
