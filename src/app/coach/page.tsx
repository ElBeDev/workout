import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/Juego";
import { getRanks } from "@/db/gamificacion";
import type { Rank } from "@/lib/xp";
import { ChevronRight, MessageCircle, Trophy, UserPlus } from "lucide-react";
import QRCode from "qrcode";
import { requireCoach } from "@/lib/coach";
import { alumnosDe } from "@/server/acceso";
import { coachPorId, tieneCupo } from "@/server/coaches";
import { solicitudesDe } from "@/server/vinculos";
import { origen } from "@/lib/origen";
import { CopyLink } from "@/components/CopyLink";
import { PendingButton } from "@/components/PendingButton";
import { responder } from "./vinculos-actions";
import { getDict, type Dict } from "@/i18n";
import { getMemberStatuses, INACTIVE_DAYS, type MemberStatus } from "@/db/gym";
import { Card, GroupedList, PageHeader, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Panel del coach (docs/coach-y-retos.md, docs/coaches.md §6): sus alumnos,
 * quién lleva días sin venir arriba, en rojo, y el resto después, del más
 * reciente al más viejo. Desde aquí se entra a la ficha de cada uno.
 */
export default async function CoachPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const coachId = await requireCoach();
  const { error } = await searchParams;
  const t = await getDict();
  const v = t.vinculos;

  const ids = await alumnosDe(coachId);
  const [members, ranks, coach, solicitudes, base] = await Promise.all([
    getMemberStatuses(ids),
    getRanks(ids),
    coachPorId(coachId),
    solicitudesDe(coachId),
    origen(),
  ]);
  // La liga y su QR (docs/coaches.md §4.2). El QR va negro sobre blanco aun
  // en modo oscuro: los lectores no leen los invertidos.
  const liga = coach ? `${base}/unirse/${coach.code}` : null;
  const qr = liga ? await QRCode.toString(liga, { type: "svg", margin: 1, width: 168 }) : null;
  const whatsapp = liga && coach ? `https://wa.me/?text=${encodeURIComponent(v.panel.mensajeWhatsapp(coach.nombre, liga))}` : null;
  const needsAttention = (m: MemberStatus) => m.daysSince === null || m.daysSince >= INACTIVE_DAYS;
  // Primero quien dejó de venir (más días, más arriba) y al final quien nunca
  // ha entrenado: al primero hay que ir a buscarlo, al segundo arrancarlo.
  const attention = members
    .filter(needsAttention)
    .sort((a, b) => (b.daysSince ?? -1) - (a.daysSince ?? -1));
  const active = members
    .filter((m) => !needsAttention(m))
    .sort((a, b) => (a.daysSince ?? 0) - (b.daysSince ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.admin.titulo} subtitle={t.admin.subtitulo} backHref="/perfil" />

      {coach && liga && (
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold">{v.panel.invitarTitulo}</p>
              <p className="text-[13px] text-muted">{v.panel.invitarAyuda}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {qr && (
              <div
                role="img"
                aria-label={v.panel.qrAlt}
                className="h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-white p-1 [&_svg]:h-full [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            )}
            <div className="min-w-0">
              <p className="label text-muted">{v.panel.tuCodigo}</p>
              <p className="text-[28px] font-bold tabular-nums">{coach.code}</p>
              <p className="text-[13px] font-semibold text-muted">{v.panel.cupo(coach.alumnos, coach.cupo)}</p>
              <p className="truncate text-[12px] text-faint">{liga}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <CopyLink url={liga} />
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-[15px] font-semibold text-white transition active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                {v.panel.whatsapp}
              </a>
            )}
          </div>
        </Card>
      )}

      {(solicitudes.length > 0 || error === "sin_cupo") && (
        <section className="flex flex-col gap-3">
          <SectionTitle className="text-accent">{v.panel.solicitudesTitulo}</SectionTitle>
          {(error === "sin_cupo" || (coach && !tieneCupo(coach) && solicitudes.length > 0)) && (
            <p className="rounded-xl bg-warning/12 px-4 py-3 text-[14px] font-semibold text-warning">{v.panel.sinCupo}</p>
          )}
          {solicitudes.length > 0 && (
            <GroupedList>
              {solicitudes.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold capitalize">{s.nombre}</p>
                    {s.username && s.username !== s.nombre && (
                      <p className="truncate text-[12px] text-faint">{s.username}</p>
                    )}
                  </div>
                  <form action={responder.bind(null, s.id, false)}>
                    <PendingButton className="flex h-10 items-center rounded-full bg-surface-2 px-4 text-[14px] font-semibold text-muted">
                      {v.panel.rechazar}
                    </PendingButton>
                  </form>
                  <form action={responder.bind(null, s.id, true)}>
                    <PendingButton className="flex h-10 items-center gap-1 rounded-full bg-primary px-4 text-[14px] font-semibold text-primary-foreground disabled:opacity-70">
                      {v.panel.aceptar}
                    </PendingButton>
                  </form>
                </div>
              ))}
            </GroupedList>
          )}
        </section>
      )}

      <GroupedList>
        <Link href="/coach/retos" className="flex items-center gap-3 p-4 transition active:bg-surface-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold">{t.admin.retosTitulo}</p>
            <p className="text-[13px] text-muted">{t.admin.retosDescripcion}</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
        </Link>
      </GroupedList>

      {members.length === 0 ? (
        <Card className="p-4 text-[15px] text-muted">{v.panel.sinAlumnos}</Card>
      ) : (
        <section className="flex flex-col gap-3">
          <SectionTitle className="text-load">{t.admin.requierenAtencion(INACTIVE_DAYS)}</SectionTitle>
          {attention.length === 0 ? (
            <Card className="p-4 text-[15px] text-muted">{t.admin.todosActivos(INACTIVE_DAYS)}</Card>
          ) : (
            <GroupedList>
              {attention.map((m) => (
                <MemberRow key={m.userId} m={m} rank={ranks.get(m.userId)} t={t} alert />
              ))}
            </GroupedList>
          )}
        </section>
      )}

      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.admin.activos}</SectionTitle>
          <GroupedList>
            {active.map((m) => (
              <MemberRow key={m.userId} m={m} rank={ranks.get(m.userId)} t={t} />
            ))}
          </GroupedList>
        </section>
      )}

    </div>
  );
}

function MemberRow({
  m,
  rank,
  t,
  alert = false,
}: {
  m: MemberStatus;
  rank: Rank | undefined;
  t: Dict;
  alert?: boolean;
}) {
  const showUsername = m.username && m.username !== m.name;
  return (
    <Link
      href={`/coach/usuarios/${m.userId}`}
      className="flex items-center gap-3 p-3 transition active:bg-surface-2"
    >
      <Avatar
        userId={m.userId}
        name={m.name}
        updatedAt={m.avatarUpdatedAt}
        size={44}
        className={alert ? "ring-2 ring-load" : ""}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[16px] font-semibold capitalize">
          <span className="truncate">{m.name}</span>
          {rank && rank.xp > 0 && <RankBadge rank={rank} size={18} t={t} />}
        </p>
        {showUsername && <p className="truncate text-[12px] text-faint">{m.username}</p>}
        <p className={`text-[13px] ${alert ? "font-semibold text-load" : "text-muted"}`}>
          {m.daysSince === null ? t.admin.nuncaHaEntrenado : t.hoy.ultimaVez(m.daysSince)}
          {m.routineCount === 0 && <span className="font-normal text-muted"> · {t.admin.sinRutinas}</span>}
        </p>
        {m.last30.days > 0 && (
          <p className="text-[12px] text-muted">{t.admin.resumen30(m.last30.days, m.last30.sets)}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
    </Link>
  );
}
