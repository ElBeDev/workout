import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ChevronRight, Dumbbell, Layers, Plus } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getFrequencyTrend,
  getMuscleCoverage,
  getPeriodStats,
  getRoutineSummaries,
  getSessionSummaries,
  getWeeklyRings,
} from "@/db/queries";
import { getLastActiveAt, getMemberComments, INACTIVE_DAYS, publicName } from "@/db/gym";
import { requireAdmin } from "@/lib/admin";
import { daysAgo, fmtDate } from "@/lib/dates";
import { bodyPartLabel } from "@/lib/body-parts";
import { fmtKg, fmtMeters, fmtMinutes, fmtMinutesShort, fmtNumber } from "@/lib/format";
import { getDict } from "@/i18n";
import {
  Card,
  GroupedList,
  Input,
  MetricTile,
  PageHeader,
  PrimaryButton,
  SectionTitle,
  StatGrid,
  TrendPill,
} from "@/components/ui";
import { RingLegend, RingTrio, type RingDatum } from "@/components/Rings";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { CoachCommentForm, CoachCommentHistory } from "@/components/CoachComments";
import { createRoutineForUser } from "../../actions";

export const dynamic = "force-dynamic";

/**
 * Ficha del socio para el coach: cómo va (semana, 30 días, músculos que se le
 * olvidan), lo que le has escrito, sus sesiones y sus rutinas. Todo sale de
 * las mismas consultas que ve el socio en Hoy y en Progreso, con su userId.
 */
export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;
  const t = await getDict();

  const [target] = await db.select().from(users).where(eq(users.id, userId));
  if (!target) notFound();

  const [userRoutines, rings, stats, freq, coverage, sessions, comments, lastActiveAt] = await Promise.all([
    getRoutineSummaries(userId),
    getWeeklyRings(userId, {
      volumeKg: target.goalWeeklyVolumeKg,
      sets: target.goalWeeklySets,
      days: target.goalWeeklyDays,
    }),
    getPeriodStats(userId, 30),
    getFrequencyTrend(userId),
    getMuscleCoverage(userId),
    getSessionSummaries(userId, { limit: 8 }),
    getMemberComments(userId),
    getLastActiveAt(userId),
  ]);

  const name = publicName(target);
  const sinceLast = lastActiveAt ? daysAgo(lastActiveAt) : null;
  const inactive = sinceLast === null || sinceLast >= INACTIVE_DAYS;
  // Sólo lo que sí ha entrenado alguna vez y se le está quedando atrás: los
  // grupos que nunca ha tocado (cuello, cardio…) serían puro ruido aquí.
  const forgotten = coverage.filter((m) => m.daysAgo !== null && m.daysAgo >= 14);

  const volume = fmtKg(rings.volumeKg, t.comun.intl);
  const goalVolume = fmtKg(rings.volumeGoal, t.comun.intl);
  const ringData: RingDatum[] = [
    {
      tone: "load",
      label: t.hoy.carga(volume.unit),
      value: rings.volumeKg,
      goal: rings.volumeGoal,
      display: `${volume.value}/${goalVolume.value}`,
    },
    {
      tone: "sets",
      label: t.hoy.series,
      value: rings.sets,
      goal: rings.setsGoal,
      display: `${fmtNumber(rings.sets, t.comun.intl)}/${fmtNumber(rings.setsGoal, t.comun.intl)}`,
    },
    {
      tone: "days",
      label: t.hoy.dias,
      value: rings.days,
      goal: rings.daysGoal,
      display: `${rings.days}/${rings.daysGoal}`,
    },
  ];
  const volume30 = fmtKg(stats.volumeKg, t.comun.intl);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={name}
        subtitle={target.username && target.username !== name ? target.username : undefined}
        backHref="/admin"
        capitalize
      />

      <Card hero className="p-5">
        <p className="label text-muted">{t.admin.usuario.estaSemana}</p>
        <div className="mt-3 flex items-center gap-5">
          <RingTrio data={ringData} size={120} />
          <RingLegend data={ringData} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-[13px] text-muted">{t.admin.usuario.ultimaActividad}</p>
          <p className={`text-[13px] font-semibold ${inactive ? "text-load" : "text-foreground"}`}>
            {sinceLast === null ? t.admin.nuncaHaEntrenado : t.hoy.ultimaVez(sinceLast)}
          </p>
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <SectionTitle>{t.admin.usuario.ultimos30}</SectionTitle>
          <TrendPill pct={freq.trendPct} label={t.progreso.tendenciaFrecuencia} />
        </div>
        <StatGrid>
          <MetricTile label={t.progreso.metricaSesiones} value={fmtNumber(stats.sessions, t.comun.intl)} tone="days" />
          <MetricTile label={t.progreso.metricaSeries} value={fmtNumber(stats.sets, t.comun.intl)} tone="sets" />
          <MetricTile label={t.progreso.metricaCarga} value={volume30.value} unit={volume30.unit} tone="load" />
          <MetricTile label={t.progreso.metricaTiempo} value={fmtMinutesShort(stats.minutes)} />
        </StatGrid>
      </section>

      {forgotten.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.admin.usuario.olvidados}</SectionTitle>
          <GroupedList>
            {forgotten.map((m) => (
              <div key={m.bodyPart} className="flex items-center justify-between px-4 py-3 text-[15px]">
                <span className="capitalize">{bodyPartLabel(m.bodyPart, t)}</span>
                <span className="font-semibold text-load">{t.hoy.ultimaVez(m.daysAgo)}</span>
              </div>
            ))}
          </GroupedList>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.coach.comentarios}</SectionTitle>
        <Card className="flex flex-col gap-4 p-4">
          <CoachCommentForm userId={userId} t={t} />
          <CoachCommentHistory comments={comments} userId={userId} t={t} />
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.admin.usuario.sesionesRecientes}</SectionTitle>
        {sessions.length === 0 ? (
          <Card className="p-4 text-[15px] text-muted">{t.admin.usuario.sinSesiones}</Card>
        ) : (
          <GroupedList>
            {sessions.map((s) => {
              const vol = fmtKg(s.volumeKg, t.comun.intl);
              const dist = fmtMeters(s.distanceMeters, t.comun.intl);
              const isSwim = s.routineKind === "natacion";
              return (
                <Link
                  key={s.id}
                  href={`/admin/usuarios/${userId}/sesion/${s.id}`}
                  className="flex items-center gap-3 p-3.5 transition active:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[16px] font-semibold ${s.routineName ? "" : "text-muted"}`}>
                      {s.routineName ?? t.progreso.rutinaEliminada}
                    </p>
                    <p className="text-[13px] text-muted">
                      {fmtDate(s.startedAt, { dateStyle: "medium" }, t.comun.intl)} · {fmtMinutes(s.minutes)}
                    </p>
                    {isSwim ? (
                      s.distanceMeters > 0 && (
                        <p className="mt-0.5 text-[13px] font-semibold text-load">
                          {dist.value} {dist.unit}
                        </p>
                      )
                    ) : (
                      <p className="mt-0.5 flex items-center gap-2 text-[13px]">
                        <span className="font-semibold text-sets">{t.progreso.series(s.sets)}</span>
                        {s.volumeKg > 0 && (
                          <span className="font-semibold text-load">
                            {vol.value} {vol.unit}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
                </Link>
              );
            })}
          </GroupedList>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.admin.usuario.rutinasTitulo}</SectionTitle>
        {userRoutines.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {userRoutines.map((r) => (
              <li key={r.id}>
                <Link href={`/rutinas/${r.id}`}>
                  <Card className="flex items-center gap-3 p-3 transition active:scale-[0.99]">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
                      <ExerciseThumb src={r.thumbUrl} alt={r.name} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-semibold">{r.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-[13px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {t.admin.usuario.ejercicios(r.exerciseCount)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5" />
                          {t.admin.usuario.series(r.totalSets)}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t.admin.usuario.sinRutinas}</p>
        )}

        <Card className="flex flex-col gap-3 p-4">
          <SectionTitle>{t.admin.usuario.nuevaRutina}</SectionTitle>
          <form action={createRoutineForUser.bind(null, userId)} className="flex flex-col gap-3">
            <Input name="name" placeholder={t.admin.usuario.nombrePlaceholder} required />
            <PrimaryButton type="submit">
              <Plus className="h-4 w-4" />
              {t.admin.usuario.crearRutina}
            </PrimaryButton>
          </form>
        </Card>
      </section>
    </div>
  );
}
