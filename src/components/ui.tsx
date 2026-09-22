import Link from "next/link";
import { ChevronLeft, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

/**
 * Primitivas del sistema visual (docs/diseno-apple-fitness.md):
 * superficie neutra + hairline, jerarquía por opacidad, y el color reservado
 * para los datos (carga / series / días).
 */

export function Card({
  children,
  className = "",
  hero = false,
}: {
  children: ReactNode;
  className?: string;
  /** La única tarjeta con sombra de cada pantalla. */
  hero?: boolean;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-surface ${
        hero ? "shadow-hero" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Etiqueta de sección: 12/600 mayúsculas. El color lo pone quien la usa. */
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`label text-muted ${className}`}>{children}</p>;
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={`label text-muted ${className}`}>{children}</h2>;
}

export function PrimaryButton({
  children,
  className = "",
  tone = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent text-accent-foreground"
      : "bg-primary text-primary-foreground";
  return (
    <button
      {...props}
      className={`flex h-13 w-full items-center justify-center gap-2 rounded-full px-5 text-[17px] font-semibold transition active:scale-[0.98] disabled:opacity-40 ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={`flex h-12 items-center justify-center gap-2 rounded-full bg-surface-2 px-5 text-[15px] font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function CircleButton({
  children,
  className = "",
  tone = "light",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "light" | "dark" | "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent text-accent-foreground"
      : tone === "dark"
        ? "bg-primary text-primary-foreground"
        : "bg-surface-2 text-foreground";
  return (
    <button
      {...props}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-[0.95] disabled:opacity-30 ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}

export function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Volver"
      className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-accent transition active:scale-95"
    >
      <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );
}

/** Cabecera de pantalla: eyebrow en acento + large title 34/700. */
export function PageHeader({
  title,
  backHref,
  right,
  subtitle,
  eyebrow,
  capitalize = false,
}: {
  title: string;
  backHref?: string;
  right?: ReactNode;
  subtitle?: string;
  eyebrow?: string;
  capitalize?: boolean;
}) {
  return (
    <header className="flex flex-col gap-1">
      {/* Con botón de volver, la acción de la derecha va arriba (como iOS);
          sin él, va junto al título para no dejar una fila vacía. */}
      {backHref && (
        <div className="flex h-11 items-center justify-between">
          <BackButton href={backHref} />
          {right}
        </div>
      )}
      {eyebrow && <p className="label text-accent">{eyebrow}</p>}
      <div className="flex items-end justify-between gap-3">
        <h1
          className={`min-w-0 flex-1 truncate text-[34px] font-bold leading-[1.1] tracking-[-0.02em] ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {title}
        </h1>
        {!backHref && right}
      </div>
      {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
    </header>
  );
}

export function Chip({
  active,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      {...props}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition active:scale-95 ${
        active
          ? "bg-accent text-accent-foreground"
          : "bg-surface-2 text-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl bg-surface-2 px-4 py-3.5 text-[17px] text-foreground outline-none transition focus:ring-2 focus:ring-accent ${className}`}
    />
  );
}

/**
 * Tile de métrica al estilo Fitness: etiqueta chica arriba, número grande
 * abajo. El color de la etiqueta codifica de qué dato se trata.
 */
export function MetricTile({
  label,
  value,
  unit,
  tone = "neutral",
  footer,
  className = "",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  tone?: "neutral" | "load" | "sets" | "days";
  footer?: ReactNode;
  className?: string;
}) {
  const toneClass = {
    neutral: "text-muted",
    load: "text-load",
    sets: "text-sets",
    days: "text-days",
  }[tone];
  return (
    <div
      className={`flex flex-col gap-1 rounded-tile border border-border bg-surface p-4 ${className}`}
    >
      <p className={`label ${toneClass}`}>{label}</p>
      <p className="text-[28px] font-bold leading-none tracking-[-0.02em]">
        {value}
        {unit && <span className="ml-1 text-[15px] font-semibold text-muted">{unit}</span>}
      </p>
      {footer && <div className="text-[13px] text-muted">{footer}</div>}
    </div>
  );
}

export function StatGrid({
  children,
  cols = 2,
}: {
  children: ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {children}
    </div>
  );
}

/** Lista agrupada iOS: una tarjeta, filas separadas por hairline. */
export function GroupedList({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group-list overflow-hidden rounded-card border border-border bg-surface ${className}`}
    >
      {children}
    </div>
  );
}

/** "↑ 12 %" con flecha y color: nunca sólo el color. */
export function TrendPill({
  pct,
  label,
  className = "",
}: {
  pct: number | null;
  /** Qué métrica es, para que no se confunda con otro porcentaje al lado. */
  label?: string;
  className?: string;
}) {
  if (pct === null) {
    return (
      <span className={`inline-flex items-center gap-1 text-[13px] font-semibold text-muted ${className}`}>
        <Minus className="h-3.5 w-3.5" /> sin comparación
      </span>
    );
  }
  const up = pct > 0;
  const flat = Math.abs(pct) < 1;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  const color = flat ? "text-muted" : up ? "text-sets" : "text-load";
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${color} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label && <span className="font-medium text-muted">{label}</span>}
      {flat ? "igual" : `${up ? "+" : ""}${Math.round(pct)} %`}
    </span>
  );
}
