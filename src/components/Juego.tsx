import Link from "next/link";
import {
  CalendarCheck,
  ChevronRight,
  Crown,
  Dumbbell,
  Flag,
  Flame,
  Target,
  Trophy,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { Dict } from "@/i18n";
import { fmtDate } from "@/lib/dates";
import { MEDALS, nextRank, type MedalGroup, type MedalUnlock, type Rank } from "@/lib/xp";

const ROMAN = { 1: "I", 2: "II", 3: "III" } as const;

/** "Plata II", "Leyenda". */
export function rankLabel(rank: Pick<Rank, "tier" | "division">, t: Dict): string {
  const name = t.juego.rangos[rank.tier] ?? rank.tier;
  return rank.division ? `${name} ${ROMAN[rank.division]}` : name;
}

/**
 * Insignia del rango: un escudo del color del rango con la división (III, II,
 * I) adentro; Leyenda, con estrella. Es SVG para que se vea igual de nítida en
 * una fila del ranking (18 px) que en el perfil.
 */
export function RankBadge({ rank, size = 20, t }: { rank: Rank; size?: number; t: Dict }) {
  const label = rankLabel(rank, t);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label} className="shrink-0">
      <title>{label}</title>
      <path
        d="M12 1.5 21 5v6.2c0 5.4-3.8 9.6-9 11.3-5.2-1.7-9-5.9-9-11.3V5z"
        fill={rank.color}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="0.8"
      />
      <path d="M12 3.3 19.3 6.2v5c0 4.4-3 7.9-7.3 9.4V3.3z" fill="rgba(255,255,255,0.14)" />
      {rank.division ? (
        <text
          x="12"
          y="15.6"
          textAnchor="middle"
          fontSize={rank.division === 3 ? 8.2 : 9.5}
          fontWeight="800"
          fill="#fff"
          fontFamily="var(--font-inter), system-ui, sans-serif"
        >
          {ROMAN[rank.division]}
        </text>
      ) : (
        <path d="m12 6.6 1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4z" fill="#fff" />
      )}
    </svg>
  );
}

/** Rango con la barra hacia el siguiente escalón. Para Hoy y Perfil. */
export function RankCard({ rank, t, href }: { rank: Rank; t: Dict; href?: string }) {
  const next = nextRank(rank);
  const body = (
    <>
      <RankBadge rank={rank} size={44} t={t} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-[19px] font-bold tracking-[-0.01em]" style={{ color: rank.color }}>
            {rankLabel(rank, t)}
          </p>
          <p className="shrink-0 text-[13px] font-semibold tabular-nums text-muted">{t.juego.xpTotal(rank.xp)}</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(Math.min(1, rank.progress) * 100)}%`, background: rank.color }}
          />
        </div>
        <p className="mt-1.5 text-[12px] text-muted">
          {next && rank.next !== null ? t.juego.faltan(rank.next - rank.xp, rankLabel(next, t)) : t.juego.maximo}
        </p>
      </div>
    </>
  );
  const className = "flex items-center gap-4 rounded-card border border-border bg-surface p-4";
  return href ? (
    <Link href={href} className={`${className} transition active:scale-[0.99]`}>
      {body}
      <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

const MEDAL_LOOK: Record<MedalGroup, { icon: LucideIcon; tone: string }> = {
  dias: { icon: CalendarCheck, tone: "bg-days/15 text-days" },
  racha: { icon: Flame, tone: "bg-load/15 text-load" },
  anillos: { icon: Target, tone: "bg-sets/15 text-sets" },
  records: { icon: Trophy, tone: "bg-accent/15 text-accent" },
  toneladas: { icon: Dumbbell, tone: "bg-load/15 text-load" },
  natacion: { icon: Waves, tone: "bg-days/15 text-days" },
  retoCumplido: { icon: Flag, tone: "bg-sets/15 text-sets" },
  retoGanado: { icon: Crown, tone: "bg-accent/15 text-accent" },
};

export function MedalIcon({ id, size = 44, locked = false }: { id: string; size?: number; locked?: boolean }) {
  const medal = MEDALS.find((m) => m.id === id);
  if (!medal) return null;
  const { icon: Icon, tone } = MEDAL_LOOK[medal.group];
  return (
    <span
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full ${locked ? "bg-surface-2 text-faint" : tone}`}
    >
      <Icon style={{ width: size * 0.48, height: size * 0.48 }} strokeWidth={2.2} />
    </span>
  );
}

/**
 * Las medallas ganadas a color con su fecha y, de cada tipo, la siguiente por
 * ganar en gris con lo que pide (las 24 de golpe eran una pared de candados).
 * `showLocked` en falso para la tarjeta de otro socio, donde sólo interesa lo
 * que ya ganó.
 */
export function MedalGrid({
  unlocked,
  t,
  showLocked = true,
}: {
  unlocked: MedalUnlock[];
  t: Dict;
  showLocked?: boolean;
}) {
  const byId = new Map(unlocked.map((m) => [m.id, m]));
  const nextOfGroup = new Set<string>();
  for (const m of MEDALS) {
    if (!byId.has(m.id) && ![...nextOfGroup].some((id) => id.startsWith(`${m.group}-`))) nextOfGroup.add(m.id);
  }
  const list = MEDALS.filter((m) => byId.has(m.id) || (showLocked && nextOfGroup.has(m.id)));
  return (
    <ul className="grid grid-cols-3 gap-2">
      {list.map((m) => {
        const got = byId.get(m.id);
        const { titulo, requisito } = t.juego.medalla(m.group, m.threshold);
        return (
          <li
            key={m.id}
            className="flex flex-col items-center gap-1.5 rounded-tile border border-border bg-surface p-3 text-center"
            title={requisito}
          >
            <MedalIcon id={m.id} locked={!got} />
            <p className={`text-[13px] font-semibold leading-tight ${got ? "" : "text-muted"}`}>{titulo}</p>
            <p className="text-[11px] leading-tight text-faint">
              {got
                ? got.at
                  ? fmtDate(got.at, { day: "numeric", month: "short" }, t.comun.intl)
                  : "✓"
                : requisito}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
