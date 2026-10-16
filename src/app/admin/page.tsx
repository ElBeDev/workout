import { requireOwner } from "@/lib/coach";
import { getDict } from "@/i18n";
import { fmtDate } from "@/lib/dates";
import { fmtNumber } from "@/lib/format";
import { blobConfigured, pendingGifIds } from "@/lib/blob";
import { resumenDueno } from "@/server/dueno";
import { Card, GroupedList, MetricTile, PageHeader, SectionTitle, StatGrid } from "@/components/ui";
import { PendingButton } from "@/components/PendingButton";
import { MirrorGifsButton } from "@/components/MirrorGifsButton";
import { BlobDiagnostics } from "@/components/BlobDiagnostics";
import { cambiarPlanGratisAction } from "./actions";

export const dynamic = "force-dynamic";
// Cada tanda de copiado baja unos gifs de ExerciseDB antes de responder.
export const maxDuration = 30;

/**
 * Panel del dueño de la plataforma (`users.is_admin`, docs/coaches.md §8.1):
 * cuántos coaches hay, quién paga, cuánto entra al mes y la lista de coaches.
 * Coaches, no alumnos: los datos de un alumno sólo los ve su coach. Abajo, el
 * mantenimiento de gifs.
 */
export default async function AdminPage() {
  const ownerId = await requireOwner();
  const t = await getDict();
  const d = t.admin.dueno;
  const [resumen, pendingGifs] = await Promise.all([
    resumenDueno(),
    blobConfigured() ? pendingGifIds(ownerId).then((ids) => ids.length) : Promise.resolve(0),
  ]);
  const fecha = (date: Date) => fmtDate(date, { day: "numeric", month: "short", year: "numeric" }, t.comun.intl);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={d.titulo} subtitle={d.subtitulo} backHref="/perfil" />

      <MetricTile
        label={d.ingreso}
        value={`$${fmtNumber(resumen.ingresoMensual)}`}
        unit="MXN"
        tone="sets"
        footer={d.ingresoNota}
      />
      <StatGrid cols={3}>
        <MetricTile label={d.coaches} value={resumen.totales.total} />
        <MetricTile label={d.pagando} value={resumen.totales.pagando} tone="sets" />
        <MetricTile label={d.enPrueba} value={resumen.totales.enPrueba} tone="days" />
        <MetricTile label={d.gratis} value={resumen.totales.gratis} />
        <MetricTile label={d.conProblemas} value={resumen.totales.conProblemas} tone="load" />
      </StatGrid>

      <section className="flex flex-col gap-3">
        <SectionTitle>{d.coaches}</SectionTitle>
        {resumen.coaches.length === 0 ? (
          <Card className="p-4 text-[15px] text-muted">{d.sinCoaches}</Card>
        ) : (
          <GroupedList>
            {resumen.coaches.map((c) => (
              <div key={c.userId} className="flex flex-col gap-2 p-3.5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold capitalize">
                      {c.nombre}
                      {c.userId === ownerId && (
                        <span className="ml-1.5 text-[12px] font-medium normal-case text-muted">({d.tu})</span>
                      )}
                    </p>
                    <p className="truncate text-[12px] text-faint">
                      {[c.username, c.marca, c.code].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-[12px] font-semibold text-muted">
                    {d.planes[c.plan] ?? c.plan}
                  </span>
                </div>
                <p className="text-[13px] text-muted">
                  {d.alumnos(c.alumnos)} · {d.estados[c.estado] ?? c.estado} · {d.alta(fecha(c.creado))}
                </p>
                {c.pruebaVencida ? (
                  <p className="text-[13px] font-semibold text-load">{d.pruebaVencida}</p>
                ) : (
                  c.plan !== "comp" &&
                  c.estado === "trialing" &&
                  c.trialEndsAt && <p className="text-[13px] text-muted">{d.pruebaHasta(fecha(c.trialEndsAt))}</p>
                )}
                {c.userId !== ownerId && (
                  <form action={cambiarPlanGratisAction.bind(null, c.userId, c.plan !== "comp")}>
                    <PendingButton className="rounded-full bg-surface-2 px-3.5 py-1.5 text-[13px] font-semibold text-foreground">
                      {c.plan === "comp" ? d.quitarGratis : d.darGratis}
                    </PendingButton>
                  </form>
                )}
              </div>
            ))}
          </GroupedList>
        )}
      </section>

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
