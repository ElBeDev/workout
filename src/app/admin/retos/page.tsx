import { Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { getAllChallenges, isMetric, METRICS } from "@/db/gym";
import { addDaysYmd, todayYmd } from "@/lib/dates";
import { fmtMetricText } from "@/lib/metric-format";
import { getDict } from "@/i18n";
import { Card, GroupedList, Input, PageHeader, PrimaryButton, SectionTitle } from "@/components/ui";
import { createChallenge, deleteChallenge } from "../actions";

export const dynamic = "force-dynamic";

const selectClass =
  "w-full appearance-none rounded-xl bg-surface-2 px-4 py-3.5 text-[17px] text-foreground outline-none focus:ring-2 focus:ring-accent";

/** Alta y baja de retos del gimnasio (docs/coach-y-retos.md). */
export default async function AdminChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const t = await getDict();
  const all = await getAllChallenges();
  const today = todayYmd();
  const range = (a: string, b: string) =>
    new Intl.DateTimeFormat(t.comun.intl, { day: "numeric", month: "short", timeZone: "UTC" }).formatRange(
      new Date(`${a}T00:00:00Z`),
      new Date(`${b}T00:00:00Z`)
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t.admin.retos.titulo} subtitle={t.admin.retos.subtitulo} backHref="/admin" />

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle>{t.admin.retos.nuevo}</SectionTitle>
        {error === "fechas" && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
            {t.admin.retos.errorFechas}
          </p>
        )}
        <form action={createChallenge} className="flex flex-col gap-3">
          <label className="label flex flex-col gap-1 text-muted">
            {t.admin.retos.nombre}
            <Input name="title" required maxLength={80} placeholder={t.admin.retos.nombrePlaceholder} />
          </label>
          <label className="label flex flex-col gap-1 text-muted">
            {t.admin.retos.metrica}
            <select name="metric" defaultValue="days" className={selectClass}>
              {METRICS.map((m) => (
                <option key={m} value={m}>
                  {t.retos.metricasLargas[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="label flex flex-col gap-1 text-muted">
            {t.admin.retos.meta}
            <Input
              name="goal"
              type="number"
              min={1}
              inputMode="numeric"
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[12px] font-normal normal-case tracking-normal">{t.admin.retos.metaAyuda}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="label flex min-w-0 flex-col gap-1 text-muted">
              {t.admin.retos.desde}
              <Input name="startsOn" type="date" required defaultValue={today} className="min-w-0" />
            </label>
            <label className="label flex min-w-0 flex-col gap-1 text-muted">
              {t.admin.retos.hasta}
              <Input name="endsOn" type="date" required defaultValue={addDaysYmd(today, 29)} className="min-w-0" />
            </label>
          </div>
          <PrimaryButton type="submit" className="mt-1">
            <Plus className="h-4 w-4" />
            {t.admin.retos.crear}
          </PrimaryButton>
        </form>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.admin.retos.todos}</SectionTitle>
        {all.length === 0 ? (
          <Card className="p-4 text-[15px] text-muted">{t.admin.retos.sinRetos}</Card>
        ) : (
          <GroupedList>
            {all.map((c) => {
              const status =
                c.endsOn < today ? t.admin.retos.terminado : c.startsOn > today ? t.admin.retos.proximo : t.admin.retos.activo;
              const active = c.startsOn <= today && c.endsOn >= today;
              return (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold">{c.title}</p>
                    <p className="text-[13px] text-muted">
                      {range(c.startsOn, c.endsOn)} · {t.retos.metricas[c.metric] ?? c.metric}
                      {c.goal !== null && isMetric(c.metric) && ` · ${fmtMetricText(c.metric, c.goal, t)}`}
                    </p>
                    <p className={`text-[12px] font-semibold ${active ? "text-sets" : "text-faint"}`}>{status}</p>
                  </div>
                  <form action={deleteChallenge.bind(null, c.id)}>
                    <button
                      type="submit"
                      aria-label={t.admin.retos.borrar}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-danger transition active:scale-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              );
            })}
          </GroupedList>
        )}
      </section>
    </div>
  );
}
