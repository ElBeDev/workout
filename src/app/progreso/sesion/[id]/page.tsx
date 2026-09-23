import { db } from "@/db";
import { workoutSessions, routines, setLogs, exercises, users } from "@/db/schema";
import { exerciseGif } from "@/db/exercise-gif";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { NotebookPen, Waves } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { bodyPartLabel } from "@/lib/body-parts";
import { fmtDate } from "@/lib/dates";
import { fmtKg, fmtMeters, fmtPace100 } from "@/lib/format";
import { getDict, type Dict } from "@/i18n";
import { getWeeklyRings, getPersonalRecords } from "@/db/queries";
import { getSwimSessionBlocks } from "@/db/swim";
import { RingTrio } from "@/components/Rings";
import { toKg, type WeightUnit } from "@/lib/suggest";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { loadLabel } from "@/lib/load-label";
import { Trophy } from "lucide-react";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { SetRowEditor } from "./SetRowEditor";

export const dynamic = "force-dynamic";

function formatDuration(start: Date, end: Date | null, t: Dict) {
  if (!end) return "—";
  const min = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000));
  return min >= 60
    ? t.progreso.duracionHorasMinutos(Math.floor(min / 60), min % 60)
    : t.progreso.duracionMinutos(min);
}

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  const userId = await requireUserId();
  const t = await getDict();

  const [session] = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      notes: workoutSessions.notes,
      routineName: routines.name,
      routineKind: routines.kind,
    })
    .from(workoutSessions)
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)));
  if (!session) notFound();

  if (session.routineKind === "natacion") {
    return <SwimSessionDetail session={session} t={t} />;
  }

  const sets = await db
    .select({
      exerciseId: exercises.id,
      name: exercises.name,
      nameEs: exercises.nameEs,
      gifUrl: exerciseGif,
      bodyPart: exercises.bodyPart,
      setId: setLogs.id,
      setNumber: setLogs.setNumber,
      weight: setLogs.weight,
      weightUnit: setLogs.weightUnit,
      plates: setLogs.plates,
      reps: setLogs.reps,
      loggedAt: setLogs.loggedAt,
    })
    .from(setLogs)
    .innerJoin(exercises, eq(setLogs.exerciseId, exercises.id))
    .where(and(eq(setLogs.sessionId, id), eq(setLogs.completed, true)))
    .orderBy(asc(setLogs.loggedAt), asc(setLogs.setNumber));

  type Group = {
    exerciseId: string;
    name: string;
    nameEs: string | null;
    gifUrl: string | null;
    bodyPart: string | null;
    sets: {
      setId: string;
      setNumber: number;
      weight: string | null;
      weightUnit: WeightUnit;
      plates: number | null;
      reps: number | null;
    }[];
  };
  const groups: Group[] = [];
  for (const s of sets) {
    let g = groups.find((x) => x.exerciseId === s.exerciseId);
    if (!g) {
      g = { exerciseId: s.exerciseId, name: s.name, nameEs: s.nameEs, gifUrl: s.gifUrl, bodyPart: s.bodyPart, sets: [] };
      groups.push(g);
    }
    g.sets.push({
      setId: s.setId,
      setNumber: s.setNumber,
      weight: s.weight,
      weightUnit: s.weightUnit === "lbs" ? "lbs" : "kg",
      plates: s.plates,
      reps: s.reps,
    });
  }
  for (const g of groups) g.sets.sort((a, b) => a.setNumber - b.setNumber);

  // Volume always sums in kg so mixing kg- and lb-tracked exercises in one
  // session still adds up to a single coherent number.
  const volume = sets.reduce(
    (sum, s) => sum + toKg(Number(s.weight ?? 0), s.weightUnit === "lbs" ? "lbs" : "kg") * (s.reps ?? 0),
    0
  );

  // Recién terminada: se muestran los anillos de la semana ya con esta sesión
  // dentro, que es la recompensa de haber entrenado.
  const finishedNow = done === "1";
  let rings = null;
  let recordsThisSession: { exerciseId: string; name: string; label: string }[] = [];
  if (finishedNow) {
    // Un ejercicio "tiene" el récord de esta sesión si, de TODO su historial,
    // la marca más alta salió de una serie de aquí — no una bandera guardada
    // al vuelo, que se desactualizaría si luego editas o borras esa serie.
    const allRecords = await getPersonalRecords(userId);
    recordsThisSession = groups
      .map((g) => {
        const r = allRecords.get(g.exerciseId);
        if (!r || r.sessionId !== id) return null;
        const label = loadLabel(t, r.weight, r.plates, r.weightUnit) ?? t.progreso.reps(r.reps);
        return { exerciseId: g.exerciseId, name: g.nameEs ?? g.name, label };
      })
      .filter((x): x is { exerciseId: string; name: string; label: string } => x !== null);

    const [me] = await db.select().from(users).where(eq(users.id, userId));
    const weekly = await getWeeklyRings(userId, {
      volumeKg: me?.goalWeeklyVolumeKg ?? 5000,
      sets: me?.goalWeeklySets ?? 60,
      days: me?.goalWeeklyDays ?? 4,
    });
    const v = fmtKg(weekly.volumeKg, t.comun.intl);
    const g = fmtKg(weekly.volumeGoal, t.comun.intl);
    rings = [
      {
        tone: "load" as const,
        label: t.progreso.anilloCarga(v.unit),
        value: weekly.volumeKg,
        goal: weekly.volumeGoal,
        display: `${v.value}/${g.value}`,
      },
      {
        tone: "sets" as const,
        label: t.progreso.anilloSeries,
        value: weekly.sets,
        goal: weekly.setsGoal,
        display: `${weekly.sets}/${weekly.setsGoal}`,
      },
      {
        tone: "days" as const,
        label: t.progreso.anilloDias,
        value: weekly.days,
        goal: weekly.daysGoal,
        display: `${weekly.days}/${weekly.daysGoal}`,
      },
    ];
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={session.routineName ?? t.progreso.rutinaEliminada}
        backHref="/progreso"
        eyebrow={finishedNow ? t.progreso.entrenamientoTerminado : undefined}
        subtitle={fmtDate(session.startedAt, { dateStyle: "full", timeStyle: "short" }, t.comun.intl)}
      />

      {rings && (
        <Card hero className="flex flex-col items-center gap-3 p-5">
          <RingTrio data={rings} size={132} />
          <p className="text-center text-[15px] text-muted">
            {t.progreso.semanaConEsteEntrenamiento}
          </p>
          <div className="grid w-full grid-cols-3 gap-2">
            {rings.map((r) => (
              <div key={r.tone} className="text-center">
                <p
                  className={`label ${
                    r.tone === "load" ? "text-load" : r.tone === "sets" ? "text-sets" : "text-days"
                  }`}
                >
                  {r.label}
                </p>
                <p className="whitespace-nowrap text-[14px] font-semibold tabular-nums">
                  {r.display}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/"
            className="mt-1 flex h-12 w-full items-center justify-center rounded-full bg-primary text-[17px] font-semibold text-primary-foreground"
          >
            {t.progreso.listo}
          </Link>
        </Card>
      )}

      {recordsThisSession.length > 0 && (
        <Card className="flex flex-col gap-3 p-4">
          <p className="label flex items-center gap-2 text-load">
            <Trophy className="h-4 w-4" /> {t.progreso.recordsSesion}
          </p>
          <ul className="flex flex-col gap-2">
            {recordsThisSession.map((r) => (
              <li key={r.exerciseId} className="flex items-center justify-between gap-3 text-[15px]">
                <span className="min-w-0 flex-1 truncate capitalize">{r.name}</span>
                <span className="shrink-0 font-semibold text-load">{r.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card hero className="grid grid-cols-2 gap-x-4 gap-y-5 p-5">
        <Stat
          label={t.progreso.duracion}
          value={formatDuration(session.startedAt, session.finishedAt, t)}
          tone="text-days"
        />
        <Stat label={t.progreso.statSeries} value={String(sets.length)} tone="text-sets" />
        <Stat
          label={t.progreso.cargaTotal}
          value={volume ? fmtKg(volume, t.comun.intl).value : "—"}
          unit={volume ? fmtKg(volume, t.comun.intl).unit : undefined}
          tone="text-load"
        />
        <Stat label={t.progreso.statEjercicios} value={String(groups.length)} tone="text-muted" />
      </Card>

      {groups.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted">{t.progreso.sesionSinSeries}</Card>
      ) : (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.progreso.ejercicios}</SectionTitle>
          {groups.map((g) => (
            <Card key={g.exerciseId} className="p-3">
              <Link href={`/progreso/${g.exerciseId}`} className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                  <ExerciseThumb src={g.gifUrl} alt={g.nameEs ?? g.name} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold capitalize">{g.nameEs ?? g.name}</p>
                  <p className="text-[12px] text-muted">{bodyPartLabel(g.bodyPart, t)}</p>
                </div>
              </Link>
              <ul className="mt-3 flex flex-col gap-1.5">
                {g.sets.map((s) => (
                  <SetRowEditor
                    key={s.setId}
                    sessionId={session.id}
                    setId={s.setId}
                    setNumber={s.setNumber}
                    weight={s.weight}
                    weightUnit={s.weightUnit}
                    plates={s.plates}
                    reps={s.reps}
                  />
                ))}
              </ul>
            </Card>
          ))}
        </section>
      )}

      {session.notes && (
        <Card className="flex flex-col gap-2 p-4">
          <SectionTitle className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-muted" /> {t.progreso.notas}
          </SectionTitle>
          <p className="whitespace-pre-wrap text-[15px]">{session.notes}</p>
        </Card>
      )}
    </div>
  );
}

/** Detalle de una sesión de natación: distancia y ritmo en vez de carga y
 *  series, bloques marcados en vez de series por ejercicio. */
async function SwimSessionDetail({
  session,
  t,
}: {
  session: {
    id: string;
    startedAt: Date;
    finishedAt: Date | null;
    notes: string | null;
    routineName: string | null;
  };
  t: Dict;
}) {
  const blocks = await getSwimSessionBlocks(session.id);
  const distanceMeters = blocks.reduce((sum, b) => sum + (b.actualDistanceMeters ?? 0), 0);
  const minutes = session.finishedAt
    ? Math.max(1, Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 60000))
    : 0;
  const pace = minutes > 0 ? fmtPace100(distanceMeters, minutes * 60) : null;
  const dist = fmtMeters(distanceMeters, t.comun.intl);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={session.routineName ?? t.progreso.rutinaEliminada}
        backHref="/progreso"
        subtitle={fmtDate(session.startedAt, { dateStyle: "full", timeStyle: "short" }, t.comun.intl)}
      />

      <Card hero className="grid grid-cols-2 gap-x-4 gap-y-5 p-5">
        <Stat
          label={t.progreso.duracion}
          value={formatDuration(session.startedAt, session.finishedAt, t)}
          tone="text-days"
        />
        <Stat label={t.natacion.sesion.distanciaTotal} value={dist.value} unit={dist.unit} tone="text-load" />
        <Stat label={t.natacion.sesion.ritmo} value={pace ?? t.natacion.progresoCard.sinRitmo} tone="text-sets" />
        <Stat label={t.natacion.sesion.bloques} value={String(blocks.length)} tone="text-muted" />
      </Card>

      {blocks.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted">{t.progreso.sesionSinSeries}</Card>
      ) : (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.natacion.rutina.bloques}</SectionTitle>
          <Card className="flex flex-col divide-y divide-border p-1">
            {blocks.map((b) => (
              <div key={b.logId} className="flex items-center gap-3 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <Waves className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug">
                    {b.label
                      ? (t.natacion.bloque.etiquetas[b.label] ?? b.label)
                      : t.natacion.sesion.bloqueEliminado}
                    {b.stroke && (
                      <span className="font-normal text-muted">
                        {" "}
                        · {t.natacion.bloque.estilos[b.stroke] ?? b.stroke}
                      </span>
                    )}
                  </p>
                  {b.reps !== null && b.distanceMeters !== null && (
                    <p className="text-[13px] text-muted">{t.natacion.bloque.resumen(b.reps, b.distanceMeters)}</p>
                  )}
                </div>
                <span className="shrink-0 text-[14px] font-semibold tabular-nums text-load">
                  {fmtMeters(b.actualDistanceMeters ?? 0, t.comun.intl).value} m
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {session.notes && (
        <Card className="flex flex-col gap-2 p-4">
          <SectionTitle className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-muted" /> {t.progreso.notas}
          </SectionTitle>
          <p className="whitespace-pre-wrap text-[15px]">{session.notes}</p>
        </Card>
      )}
    </div>
  );
}

/** Etiqueta chica arriba, valor grande abajo — el patrón del detalle de
 *  entrenamiento de Fitness. */
function Stat({
  value,
  label,
  unit,
  tone,
}: {
  value: string;
  label: string;
  unit?: string;
  tone: string;
}) {
  return (
    <div className="min-w-0">
      <p className={`label ${tone}`}>{label}</p>
      <p className="truncate text-[28px] font-bold leading-none tracking-[-0.02em] tabular-nums">
        {value}
        {unit && <span className="ml-1 text-[15px] font-semibold text-muted">{unit}</span>}
      </p>
    </div>
  );
}
