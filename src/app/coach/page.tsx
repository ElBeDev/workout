import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/Juego";
import { getRanks } from "@/db/gamificacion";
import type { Rank } from "@/lib/xp";
import { ChevronRight, Trophy } from "lucide-react";
import { requireCoach } from "@/lib/coach";
import { alumnosDe } from "@/server/acceso";
import { getDict, type Dict } from "@/i18n";
import { getMemberStatuses, INACTIVE_DAYS, type MemberStatus } from "@/db/gym";
import { Card, GroupedList, PageHeader, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Panel del coach (docs/coach-y-retos.md, docs/coaches.md §6): sus alumnos,
 * quién lleva días sin venir arriba, en rojo, y el resto después, del más
 * reciente al más viejo. Desde aquí se entra a la ficha de cada uno.
 */
export default async function CoachPage() {
  const coachId = await requireCoach();
  const t = await getDict();

  const ids = await alumnosDe(coachId);
  const [members, ranks] = await Promise.all([getMemberStatuses(ids), getRanks(ids)]);
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
