import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { NotebookPen, Waves } from "lucide-react";
import { db } from "@/db";
import { routines, users, workoutSessions } from "@/db/schema";
import { getSessionExerciseGroups } from "@/db/queries";
import { getSwimSessionBlocks } from "@/db/swim";
import { getSessionComments, publicName } from "@/db/gym";
import { requireAdmin } from "@/lib/admin";
import { fmtDate } from "@/lib/dates";
import { bodyPartLabel } from "@/lib/body-parts";
import { loadLabel } from "@/lib/load-label";
import { fmtKg, fmtMeters, fmtMinutes } from "@/lib/format";
import { getDict } from "@/i18n";
import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { ExerciseThumb } from "@/components/ExerciseThumb";
import { CoachCommentForm, CoachCommentList } from "@/components/CoachComments";

export const dynamic = "force-dynamic";

/**
 * Una sesión de un socio vista por el coach: lo mismo que el socio ve en su
 * detalle, sin poder editar las series (son del socio), y con el hilo de
 * comentarios sobre esa sesión.
 */
export default async function CoachSessionPage({
  params,
}: {
  params: Promise<{ userId: string; sessionId: string }>;
}) {
  await requireAdmin();
  const { userId, sessionId } = await params;
  const t = await getDict();

  const [session] = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      finishedAt: workoutSessions.finishedAt,
      notes: workoutSessions.notes,
      routineName: routines.name,
      routineKind: routines.kind,
      username: users.username,
      displayName: users.displayName,
    })
    .from(workoutSessions)
    .innerJoin(users, eq(workoutSessions.userId, users.id))
    .leftJoin(routines, eq(workoutSessions.routineId, routines.id))
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));
  if (!session) notFound();

  const isSwim = session.routineKind === "natacion";
  const [strength, blocks, comments] = await Promise.all([
    isSwim ? null : getSessionExerciseGroups(sessionId),
    isSwim ? getSwimSessionBlocks(sessionId) : null,
    getSessionComments(sessionId),
  ]);

  const minutes = session.finishedAt
    ? Math.max(1, Math.round((session.finishedAt.getTime() - session.startedAt.getTime()) / 60000))
    : null;
  const volume = strength ? fmtKg(strength.volumeKg, t.comun.intl) : null;
  const distance = blocks
    ? fmtMeters(blocks.reduce((sum, b) => sum + (b.actualDistanceMeters ?? 0), 0), t.comun.intl)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={`${publicName(session)} · ${t.admin.sesion.soloLectura}`}
        title={session.routineName ?? t.progreso.rutinaEliminada}
        backHref={`/admin/usuarios/${userId}`}
        subtitle={fmtDate(session.startedAt, { dateStyle: "full", timeStyle: "short" }, t.comun.intl)}
      />

      <Card hero className="grid grid-cols-3 divide-x divide-border p-4">
        <Stat label={t.progreso.duracion} value={minutes ? fmtMinutes(minutes) : "—"} tone="text-days" />
        {strength ? (
          <>
            <Stat label={t.progreso.statSeries} value={String(strength.setCount)} tone="text-sets" />
            <Stat
              label={t.progreso.cargaTotal}
              value={strength.volumeKg > 0 && volume ? `${volume.value} ${volume.unit}` : "—"}
              tone="text-load"
            />
          </>
        ) : (
          <>
            <Stat label={t.natacion.sesion.bloques} value={String(blocks?.length ?? 0)} tone="text-sets" />
            <Stat
              label={t.natacion.sesion.distanciaTotal}
              value={distance ? `${distance.value} ${distance.unit}` : "—"}
              tone="text-load"
            />
          </>
        )}
      </Card>

      <section className="flex flex-col gap-3">
        <CoachCommentList comments={comments} t={t} deletable />
        <Card className="p-4">
          <CoachCommentForm userId={userId} sessionId={sessionId} t={t} />
        </Card>
      </section>

      {session.notes && (
        <Card className="flex flex-col gap-2 p-4">
          <SectionTitle className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-muted" /> {t.admin.sesion.notasDelSocio}
          </SectionTitle>
          <p className="whitespace-pre-wrap text-[15px]">{session.notes}</p>
        </Card>
      )}

      {strength &&
        (strength.groups.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted">{t.progreso.sesionSinSeries}</Card>
        ) : (
          <section className="flex flex-col gap-3">
            <SectionTitle>{t.progreso.ejercicios}</SectionTitle>
            {strength.groups.map((g) => (
              <Card key={g.exerciseId} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                    <ExerciseThumb src={g.gifUrl} alt={g.nameEs ?? g.name} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold capitalize">{g.nameEs ?? g.name}</p>
                    <p className="text-[12px] text-muted">{bodyPartLabel(g.bodyPart, t)}</p>
                  </div>
                </div>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {g.sets.map((s) => (
                    <li key={s.setId} className="flex items-center gap-3 text-[14px]">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[13px] font-bold text-faint tabular-nums">
                        {s.setNumber}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {loadLabel(t, s.weight, s.plates, s.weightUnit) ?? "—"}
                      </span>
                      <span className="text-muted">×</span>
                      <span className="tabular-nums">{t.progreso.reps(s.reps)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </section>
        ))}

      {blocks &&
        (blocks.length === 0 ? (
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
                  <p className="min-w-0 flex-1 text-[15px] font-semibold leading-snug">
                    {b.label ? (t.natacion.bloque.etiquetas[b.label] ?? b.label) : t.natacion.sesion.bloqueEliminado}
                    {b.stroke && (
                      <span className="font-normal text-muted"> · {t.natacion.bloque.estilos[b.stroke] ?? b.stroke}</span>
                    )}
                  </p>
                  <span className="shrink-0 text-[14px] font-semibold tabular-nums text-load">
                    {fmtMeters(b.actualDistanceMeters ?? 0, t.comun.intl).value} m
                  </span>
                </div>
              ))}
            </Card>
          </section>
        ))}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 px-1">
      <span className={`label ${tone}`}>{label}</span>
      <span className="truncate whitespace-nowrap text-[18px] font-bold leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </span>
    </div>
  );
}
