import type { ReactNode } from "react";

/**
 * Anillos al estilo Apple Fitness (docs/diseno-apple-fitness.md §2.2):
 * track del mismo color al 22 %, arco con degradado, extremos redondeados y
 * una segunda vuelta dibujada encima cuando pasas del 100 %.
 *
 * Server component: es SVG estático, la entrada se anima con CSS.
 */

export type RingTone = "load" | "sets" | "days";

export type RingDatum = {
  tone: RingTone;
  label: string;
  value: number;
  goal: number;
  /** Texto ya formateado a mostrar (p. ej. "4,280 / 5,000 KG"). */
  display: string;
};

const GEOMETRY = [
  { r: 43, w: 11 },
  { r: 29.5, w: 11 },
  { r: 16, w: 11 },
] as const;

function Arc({
  tone,
  pct,
  r,
  w,
  delay,
  animate,
  trackOpacity = 0.2,
}: {
  tone: RingTone;
  pct: number;
  r: number;
  w: number;
  delay: number;
  animate: boolean;
  trackOpacity?: number;
}) {
  const c = 2 * Math.PI * r;
  const first = Math.min(pct, 1);
  const overflow = Math.min(Math.max(pct - 1, 0), 1);
  const style = animate
    ? ({
        ["--dash-from" as string]: `${c}px`,
        animation: `ring-fill 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
      } as React.CSSProperties)
    : undefined;

  return (
    <g transform="rotate(-90 50 50)">
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth={w}
        stroke={`var(--arc-${tone})`}
        strokeOpacity={trackOpacity}
      />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth={w}
        stroke={`url(#ring-grad-${tone})`}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={(1 - first) * c}
        style={style}
      />
      {overflow > 0 && (
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth={w}
          stroke={`url(#ring-grad-${tone})`}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={(1 - overflow) * c}
          filter="url(#ring-shadow)"
        />
      )}
    </g>
  );
}

function Defs({ tones }: { tones: RingTone[] }) {
  return (
    <defs>
      {tones.map((tone) => (
        <linearGradient
          key={tone}
          id={`ring-grad-${tone}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor={`var(--arc-${tone})`} />
          <stop offset="100%" stopColor={`var(--arc-${tone}-2)`} />
        </linearGradient>
      ))}
      <filter id="ring-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodOpacity="0.45" />
      </filter>
    </defs>
  );
}

export function RingTrio({
  data,
  size = 160,
  animate = true,
  className = "",
}: {
  data: RingDatum[];
  size?: number;
  animate?: boolean;
  className?: string;
}) {
  const pcts = data.map((d) => (d.goal > 0 ? d.value / d.goal : 0));
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label={data.map((d) => `${d.label}: ${d.display}`).join(". ")}
    >
      <Defs tones={data.map((d) => d.tone)} />
      {data.map((d, i) => (
        <Arc
          key={d.tone}
          tone={d.tone}
          pct={pcts[i]}
          r={GEOMETRY[i].r}
          w={GEOMETRY[i].w}
          delay={i * 90}
          animate={animate}
        />
      ))}
    </svg>
  );
}

/** Un solo anillo, para el HUD del entrenamiento y las tarjetas chicas. */
export function Ring({
  tone,
  pct,
  size = 48,
  thickness = 11,
  animate = false,
  children,
}: {
  tone: RingTone;
  pct: number;
  size?: number;
  thickness?: number;
  animate?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <Defs tones={[tone]} />
        <Arc tone={tone} pct={pct} r={43} w={thickness} delay={0} animate={animate} />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

/** Leyenda: etiqueta en el color del dato + valor grande, como en Fitness. */
export function RingLegend({ data }: { data: RingDatum[] }) {
  const toneClass: Record<RingTone, string> = {
    load: "text-load",
    sets: "text-sets",
    days: "text-days",
  };
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
      {data.map((d) => (
        <div key={d.tone} className="min-w-0">
          <p className={`label ${toneClass[d.tone]}`}>{d.label}</p>
          <p className="truncate text-[20px] font-bold leading-none tracking-[-0.03em]">
            {d.display}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Trío miniatura para cada día del calendario de constancia. */
export function MiniRings({
  pcts,
  size = 18,
  dim = false,
}: {
  pcts: [number, number, number];
  size?: number;
  dim?: boolean;
}) {
  const tones: RingTone[] = ["load", "sets", "days"];
  const geo = [
    { r: 42, w: 15 },
    { r: 25, w: 15 },
    { r: 8, w: 15 },
  ];
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      className={dim ? "opacity-30" : undefined}
    >
      <Defs tones={tones} />
      {tones.map((tone, i) => (
        <Arc
          key={tone}
          tone={tone}
          pct={pcts[i]}
          r={geo[i].r}
          w={geo[i].w}
          delay={0}
          animate={false}
          trackOpacity={0.14}
        />
      ))}
    </svg>
  );
}
