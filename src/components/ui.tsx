import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-border bg-surface shadow-[0_2px_12px_rgba(21,21,31,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={`text-[17px] font-semibold tracking-tight ${className}`}>
      {children}
    </h2>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 text-[15px] font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(21,21,31,0.18)] transition active:scale-[0.98] disabled:opacity-50 ${className}`}
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
      className={`flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3.5 text-[15px] font-medium text-foreground transition active:scale-[0.98] disabled:opacity-50 ${className}`}
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
  tone?: "light" | "dark";
}) {
  const toneClass =
    tone === "dark"
      ? "bg-primary text-primary-foreground"
      : "border border-border bg-surface-2 text-foreground";
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-[0_2px_12px_rgba(21,21,31,0.06)]"
    >
      <ChevronLeft className="h-5 w-5" />
    </Link>
  );
}

export function PageHeader({
  title,
  backHref,
  right,
  subtitle,
  capitalize = false,
}: {
  title: string;
  backHref?: string;
  right?: ReactNode;
  subtitle?: string;
  capitalize?: boolean;
}) {
  return (
    <header className="flex items-center gap-3">
      {backHref && <BackButton href={backHref} />}
      <div className="min-w-0 flex-1">
        <h1
          className={`truncate text-[26px] font-bold leading-tight tracking-tight ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
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
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-surface text-foreground"
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
      className={`w-full rounded-2xl border border-border bg-surface-2 px-4 py-3.5 text-[15px] text-foreground outline-none focus:ring-2 focus:ring-accent ${className}`}
    />
  );
}
