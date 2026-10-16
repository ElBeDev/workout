import Link from "next/link";
import { eq } from "drizzle-orm";
import { CalendarClock, CheckCircle2, Crown, EyeOff, Trophy, Users } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getActivity,
  getChallengeActivity,
  getChallenges,
  isMetric,
  metricValue,
  METRICS,
  periodRange,
  PERIODS,
  rank,
  type ActivityRow,
  type Challenge,
  type Metric,
  type Period,
  type RankedRow,
} from "@/db/gym";
import { requireUserId } from "@/lib/session";
import { grupoDe } from "@/server/acceso";
import { daysBetweenYmd, todayYmd } from "@/lib/dates";
import { fmtMetric, fmtMetricText, METRIC_BG, METRIC_TONE } from "@/lib/metric-format";
import { getDict, type Dict } from "@/i18n";
import { Card, GroupedList, PageHeader, SectionTitle } from "@/components/ui";
import { Avatar } from "@/components/Avatar";
import { RankBadge } from "@/components/Juego";
import { getRanks } from "@/db/gamificacion";
import type { Rank } from "@/lib/xp";

export const dynamic = "force-dynamic";

/** Cuántos lugares enseña la tarjeta de un reto antes de "tú". */
const PODIUM = 3;

/**
 * Retos (docs/coach-y-retos.md): los retos que armó el coach y el ranking del
 * gimnasio de la semana o del mes. Todo se calcula al vuelo de las series y
 * bloques ya registrados; no hay puntos guardados que se puedan desincronizar.
 */
export default async function RetosPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; m?: string }>;
}) {
  const userId = await requireUserId();
  const t = await getDict();
  const { p, m } = await searchParams;
  const period: Period = (PERIODS as readonly string[]).includes(p ?? "") ? (p as Period) : "mes";
  // XP por omisión: premia venir (100 por día) y el trabajo, no cuánto
  // levantas, así que cualquiera puede ganar (docs/gamificacion.md §4.1).
  const metric: Metric = isMetric(m) ? m : "xp";

  const range = periodRange(period);
  // Todo es del grupo: el de su coach, o el suyo si es coach (docs/coaches.md §5).
  const grupo = await grupoDe(userId);
  const [[me], board, challenges, ranks] = await Promise.all([
    db.select({ showInRanking: users.showInRanking }).from(users).where(eq(users.id, userId)),
    getActivity(range.since, range.until, { userIds: grupo.ids }),
    getChallenges(grupo.coachId),
    getRanks(grupo.ids),
  ]);
  const [activeBoards, finishedBoards] = await Promise.all([
    Promise.all(challenges.active.map((c) => getChallengeActivity(c))),
    Promise.all(challenges.finished.map((c) => getChallengeActivity(c))),
  ]);

  // Todos los del grupo salen en el ranking, aunque vayan en cero.
  const ranked = rank(board, metric, { withZeros: true });
  const mine = ranked.find((r) => r.userId === userId) ?? null;
  const anyScored = ranked.some((r) => r.value > 0);
  const hidden = me && !me.showInRanking;
  const href = (next: { p?: Period; m?: Metric }) =>
    `/retos?p=${next.p ?? period}&m=${next.m ?? metric}`;

  return (
    <div className="flex flex-col gap-7">
      <PageHeader title={t.retos.titulo} subtitle={t.retos.subtitulo} />

      {hidden && (
        <Link href="/perfil" className="flex items-center gap-3 rounded-card bg-warning/12 p-4 text-[14px] font-semibold text-warning">
          <EyeOff className="h-5 w-5 shrink-0" />
          {t.retos.oculto}
        </Link>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>{t.retos.activos}</SectionTitle>
        {challenges.active.length === 0 ? (
          <Card className="flex items-center gap-3 p-4 text-[15px] text-muted">
            <Trophy className="h-5 w-5 shrink-0" />
            {t.retos.sinRetos}
          </Card>
        ) : (
          challenges.active.map((c, i) => (
            <ChallengeCard key={c.id} challenge={c} rows={activeBoards[i]} userId={userId} t={t} />
          ))
        )}
      </section>

      {challenges.upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.retos.proximos}</SectionTitle>
          <GroupedList>
            {challenges.upcoming.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3.5">
                <CalendarClock className="h-5 w-5 shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold">{c.title}</p>
                  <p className="text-[13px] text-muted">
                    {t.retos.empieza(fmtDay(c.startsOn, t))} · {t.retos.metricas[c.metric] ?? c.metric}
                  </p>
                </div>
              </div>
            ))}
          </GroupedList>
        </section>
      )}

      {!grupo.coachId ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.retos.ranking}</SectionTitle>
          {/* Sin coach no hay grupo con quién competir (docs/coaches.md §5). */}
          <Card className="flex items-center gap-3 p-4 text-[15px] text-muted">
            <Users className="h-5 w-5 shrink-0" />
            {t.retos.sinCoach}
          </Card>
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.retos.ranking}</SectionTitle>
          <div className="flex gap-1 rounded-full bg-surface-2 p-1">
            {PERIODS.map((option) => (
              <Link
                key={option}
                href={href({ p: option })}
                scroll={false}
                className={`flex-1 rounded-full py-2 text-center text-[13px] font-semibold transition ${
                  option === period ? "bg-surface text-foreground shadow-hero" : "text-muted"
                }`}
              >
                {t.retos[option]}
              </Link>
            ))}
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {METRICS.map((option) => (
              <Link
                key={option}
                href={href({ m: option })}
                scroll={false}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-95 ${
                  option === metric ? "bg-accent text-accent-foreground" : "bg-surface-2 text-muted"
                }`}
              >
                {t.retos.metricas[option]}
              </Link>
            ))}
          </div>

          {!anyScored && <p className="text-[13px] text-muted">{t.retos.sinActividad}</p>}
          {ranked.length > 0 && (
            <GroupedList>
              {ranked.map((r) => (
                <BoardRow key={r.userId} row={r} rank={ranks.get(r.userId)} metric={metric} isMe={r.userId === userId} t={t} />
              ))}
            </GroupedList>
          )}
          {!hidden && anyScored && mine?.value === 0 && (
            <p className="text-[13px] text-muted">{t.retos.noSumas}</p>
          )}
          {metric === "volume" && <p className="text-[12px] text-faint">{t.retos.notaCarga}</p>}
        </section>
      )}

      {challenges.finished.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>{t.retos.terminados}</SectionTitle>
          <GroupedList>
            {challenges.finished.map((c, i) => {
              const cMetric = isMetric(c.metric) ? c.metric : "days";
              const top = rank(finishedBoards[i], cMetric);
              const winners = top.filter((r) => r.position === 1);
              return (
                <div key={c.id} className="flex items-center gap-3 p-3.5">
                  <Crown className={`h-5 w-5 shrink-0 ${winners.length ? "text-load" : "text-faint"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold">{c.title}</p>
                    <p className="text-[13px] text-muted">
                      {winners.length
                        ? `${t.retos.gano(winners.map((w) => w.name).join(", "))} · ${fmtMetricText(cMetric, winners[0].value, t)}`
                        : t.retos.nadieSumo}
                    </p>
                    <p className="text-[12px] text-faint">{t.retos.termino(fmtDay(c.endsOn, t))}</p>
                  </div>
                </div>
              );
            })}
          </GroupedList>
        </section>
      )}
    </div>
  );
}

function fmtDay(ymd: string, t: Dict): string {
  return new Intl.DateTimeFormat(t.comun.intl, { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${ymd}T00:00:00Z`)
  );
}

function ChallengeCard({
  challenge: c,
  rows,
  userId,
  t,
}: {
  challenge: Challenge;
  rows: ActivityRow[];
  userId: string;
  t: Dict;
}) {
  const metric: Metric = isMetric(c.metric) ? c.metric : "days";
  const ranked = rank(rows, metric);
  const myRow = rows.find((r) => r.userId === userId);
  const myValue = myRow ? metricValue(myRow, metric) : 0;
  const mine = ranked.find((r) => r.userId === userId);
  const left = daysBetweenYmd(todayYmd(), c.endsOn);
  const pct = c.goal ? Math.min(1, myValue / c.goal) : 0;
  const done = c.goal !== null && myValue >= c.goal;
  const achieved = c.goal !== null ? rows.filter((r) => metricValue(r, metric) >= c.goal!).length : 0;
  const podium = ranked.slice(0, PODIUM);
  const showMeBelow = mine && !podium.some((r) => r.userId === userId);

  return (
    <Card hero className="flex flex-col gap-4 p-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className={`label ${METRIC_TONE[metric]}`}>{t.retos.metricasLargas[metric]}</p>
          <p className="text-[13px] font-semibold text-muted">{t.retos.faltan(left)}</p>
        </div>
        <p className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.02em]">{c.title}</p>
        <p className="mt-0.5 text-[13px] text-muted">
          {c.goal !== null ? t.retos.meta(fmtMetricText(metric, c.goal, t)) : t.retos.sinMeta}
        </p>
      </div>

      {myRow && c.goal !== null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[13px] font-semibold text-muted">{t.retos.tuProgreso}</p>
            <p className="text-[15px] font-bold tabular-nums">
              {done ? (
                <span className="inline-flex items-center gap-1 text-sets">
                  <CheckCircle2 className="h-4 w-4" /> {t.retos.completado}
                </span>
              ) : (
                `${fmtMetric(metric, myValue, t).value} / ${fmtMetricText(metric, c.goal, t)}`
              )}
            </p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full rounded-full ${METRIC_BG[metric]}`} style={{ width: `${Math.round(pct * 100)}%` }} />
          </div>
          <p className="text-[12px] text-muted">{t.retos.loLograron(achieved, rows.length)}</p>
        </div>
      )}

      {ranked.length === 0 ? (
        <p className="text-[14px] text-muted">{t.retos.sinActividad}</p>
      ) : (
        <ul className="flex flex-col gap-1 border-t border-border pt-3">
          {podium.map((r) => (
            <MiniRow key={r.userId} row={r} metric={metric} isMe={r.userId === userId} t={t} />
          ))}
          {showMeBelow && mine && (
            <>
              <li className="py-0.5 text-center text-[12px] text-faint">···</li>
              <MiniRow row={mine} metric={metric} isMe t={t} />
            </>
          )}
        </ul>
      )}
    </Card>
  );
}

function MiniRow({ row, metric, isMe, t }: { row: RankedRow; metric: Metric; isMe: boolean; t: Dict }) {
  const v = fmtMetric(metric, row.value, t);
  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-[15px] ${isMe ? "bg-accent/10" : ""}`}
    >
      <Position n={row.position} />
      <Avatar userId={row.userId} name={row.name} updatedAt={row.avatarUpdatedAt} size={24} />
      <span className="min-w-0 flex-1 truncate capitalize">
        {row.name}
        {isMe && <span className="ml-1 text-[12px] font-semibold normal-case text-accent">({t.retos.tu})</span>}
      </span>
      <span className="shrink-0 font-semibold tabular-nums">
        {v.value} <span className="text-[12px] text-muted">{v.unit}</span>
      </span>
    </li>
  );
}

function BoardRow({
  row,
  rank,
  metric,
  isMe,
  t,
}: {
  row: RankedRow;
  rank: Rank | undefined;
  metric: Metric;
  isMe: boolean;
  t: Dict;
}) {
  const v = fmtMetric(metric, row.value, t);
  return (
    <Link
      href={`/retos/socio/${row.userId}`}
      className={`flex items-center gap-3 p-3 transition active:bg-surface-2 ${isMe ? "bg-accent/10" : ""}`}
      aria-label={`${t.retos.lugar(row.position)} · ${t.juego.verPerfil(row.name)}`}
    >
      <Position n={row.value > 0 ? row.position : null} />
      <Avatar userId={row.userId} name={row.name} updatedAt={row.avatarUpdatedAt} size={40} />
      <p className="flex min-w-0 flex-1 items-center gap-1.5 text-[16px] font-semibold">
        <span className="truncate capitalize">{row.name}</span>
        {rank && <RankBadge rank={rank} size={18} t={t} />}
        {isMe && <span className="text-[12px] font-semibold text-accent">{t.retos.tu}</span>}
      </p>
      <p className="shrink-0 text-[17px] font-bold tabular-nums">
        <span className={METRIC_TONE[metric]}>{v.value}</span>
        <span className="ml-1 text-[12px] font-semibold text-muted">{v.unit}</span>
      </p>
    </Link>
  );
}

/**
 * Lugar en la tabla: el primero con corona, los demás con su número y quien
 * va en cero (`null`) con un guion, sin lugar.
 */
function Position({ n }: { n: number | null }) {
  if (n === 1) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-load/15 text-load">
        <Crown className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center text-[14px] font-bold tabular-nums text-faint">
      {n ?? "–"}
    </span>
  );
}
