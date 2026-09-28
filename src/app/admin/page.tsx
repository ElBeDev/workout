import Link from "next/link";
import { ChevronRight, ShieldCheck, Trophy } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getDict, type Dict } from "@/i18n";
import { blobConfigured, pendingGifIds } from "@/lib/blob";
import { getMemberStatuses, INACTIVE_DAYS, type MemberStatus } from "@/db/gym";
import { Card, GroupedList, PageHeader, SectionTitle } from "@/components/ui";
import { MirrorGifsButton } from "@/components/MirrorGifsButton";
import { BlobDiagnostics } from "@/components/BlobDiagnostics";

export const dynamic = "force-dynamic";
// Cada tanda de copiado baja unos gifs de ExerciseDB antes de responder.
export const maxDuration = 30;

/**
 * Panel del coach (docs/coach-y-retos.md): quién lleva días sin venir arriba,
 * en rojo, y el resto después, del más reciente al más viejo. Desde aquí se
 * entra a la ficha de cada socio.
 */
export default async function AdminPage() {
  const adminId = await requireAdmin();
  const t = await getDict();

  const members = await getMemberStatuses();
  const needsAttention = (m: MemberStatus) => m.daysSince === null || m.daysSince >= INACTIVE_DAYS;
  // Primero quien dejó de venir (más días, más arriba) y al final quien nunca
  // ha entrenado: al primero hay que ir a buscarlo, al segundo arrancarlo.
  const attention = members
    .filter(needsAttention)
    .sort((a, b) => (b.daysSince ?? -1) - (a.daysSince ?? -1));
  const active = members
    .filter((m) => !needsAttention(m))
    .sort((a, b) => (a.daysSince ?? 0) - (b.daysSince ?? 0));

  // Mantenimiento: respaldar los gifs es plomería, no algo de lo que el usuario
  // se tenga que enterar, así que vive aquí y no en Perfil.
  const pendingGifs = blobConfigured() ? (await pendingGifIds(adminId)).length : 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.admin.titulo} subtitle={t.admin.subtitulo} backHref="/perfil" />

      <GroupedList>
        <Link href="/admin/retos" className="flex items-center gap-3 p-4 transition active:bg-surface-2">
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
              <MemberRow key={m.userId} m={m} adminId={adminId} t={t} alert />
            ))}
          </GroupedList>
        )}
      </section>

      {active.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.admin.activos}</SectionTitle>
          <GroupedList>
            {active.map((m) => (
              <MemberRow key={m.userId} m={m} adminId={adminId} t={t} />
            ))}
          </GroupedList>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.admin.mantenimiento}</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[13px] text-muted">{t.admin.respaldoExplicacion}</p>
          {blobConfigured() ? (
            <MirrorGifsButton pending={pendingGifs} />
          ) : (
            <p className="rounded-xl bg-warning/12 px-3 py-2 text-[13px] font-semibold text-warning">
              {t.admin.respaldoSinToken}
            </p>
          )}
          <BlobDiagnostics />
        </Card>
      </section>
    </div>
  );
}

function MemberRow({
  m,
  adminId,
  t,
  alert = false,
}: {
  m: MemberStatus;
  adminId: string;
  t: Dict;
  alert?: boolean;
}) {
  const showUsername = m.username && m.username !== m.name;
  return (
    <Link
      href={`/admin/usuarios/${m.userId}`}
      className="flex items-center gap-3 p-3 transition active:bg-surface-2"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[17px] font-bold uppercase ${
          alert ? "bg-load/15 text-load" : "bg-surface-2 text-muted"
        }`}
      >
        {m.name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold capitalize">
          {m.name}
          {m.userId === adminId && (
            <span className="ml-1.5 inline-flex items-center gap-1 text-[11px] font-medium normal-case text-muted">
              <ShieldCheck className="h-3 w-3" /> {t.admin.tu}
            </span>
          )}
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
