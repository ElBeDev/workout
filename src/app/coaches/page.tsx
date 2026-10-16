import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CalendarX2, Copy, Link2, Trophy, Waves } from "lucide-react";
import { Card, GroupedList, SectionTitle } from "@/components/ui";
import { LegalFooter } from "@/components/LegalFooter";
import { getDict } from "@/i18n";
import { fmtNumber } from "@/lib/format";
import { DIAS_PRUEBA, PLANES, PRECIO_ANUAL_COACH } from "@/lib/planes";

export const metadata: Metadata = {
  title: "GainLine para coaches",
  description: "Rutinas, seguimiento y ranking para tus alumnos. $199 al mes, todo incluido.",
};

// Un ícono por función, en el mismo orden que `publico.coaches.funciones`.
const ICONOS = [Copy, CalendarX2, Bell, Trophy, Link2, Waves];

/**
 * La página que se le manda a un coach para venderle (docs/coaches.md §8.2).
 * Pública: sin sesión y sin barra de abajo. Sólo cuenta lo que ya existe.
 */
export default async function CoachesPage() {
  const t = await getDict();
  const c = t.publico.coaches;

  return (
    <div className="flex flex-col gap-8 pb-4 pt-6">
      <section className="flex flex-col items-center gap-4 text-center">
        <div className="h-16 w-16 overflow-hidden rounded-card shadow-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-512.png" alt="" className="h-full w-full object-cover" />
        </div>
        <p className="label text-accent">{c.etiqueta}</p>
        <h1 className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em]">{c.titulo}</h1>
        <p className="text-[17px] text-muted">{c.subtitulo}</p>
        <div className="flex flex-col items-center gap-1">
          <p className="text-[20px] font-bold">{c.precio(PLANES.coach.precio)}</p>
          <p className="text-[14px] text-muted">{c.precioNota}</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Link
            href="/registro/coach"
            className="flex h-12 items-center justify-center rounded-full bg-primary px-5 text-[16px] font-semibold text-primary-foreground transition active:scale-[0.98]"
          >
            {c.cta}
          </Link>
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-full bg-surface-2 px-5 text-[15px] font-semibold text-foreground transition active:scale-[0.98]"
          >
            {c.yaTengoCuenta}
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{c.queHace}</SectionTitle>
        <GroupedList>
          {c.funciones.map((f, i) => {
            const Icon = ICONOS[i] ?? Trophy;
            return (
              <div key={f.titulo} className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold">{f.titulo}</p>
                  <p className="text-[14px] text-muted">{f.texto}</p>
                </div>
              </div>
            );
          })}
        </GroupedList>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{c.comoFunciona}</SectionTitle>
        <ol className="flex flex-col gap-2">
          {c.pasos.map((paso, i) => (
            <li key={paso} className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[15px] font-bold tabular-nums">
                {i + 1}
              </span>
              <span className="text-[16px]">{paso}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{c.precios}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Card hero className="flex flex-col gap-1 p-4">
            <p className="text-[15px] font-semibold">{c.planCoach}</p>
            <p className="text-[30px] font-bold leading-none tracking-[-0.02em]">${PLANES.coach.precio}</p>
            <p className="text-[13px] text-muted">{c.alMes}</p>
            <p className="mt-1 text-[13px] font-semibold text-accent">{c.planCoachDetalle(PLANES.coach.cupo)}</p>
          </Card>
          <Card className="flex flex-col gap-1 p-4">
            <p className="text-[15px] font-semibold">{c.planPlus}</p>
            <p className="text-[30px] font-bold leading-none tracking-[-0.02em]">${PLANES.coach_plus.precio}</p>
            <p className="text-[13px] text-muted">{c.alMes}</p>
            <p className="mt-1 text-[13px] font-semibold text-muted">{c.planPlusDetalle}</p>
          </Card>
        </div>
        <p className="text-[14px] text-muted">{c.incluye}</p>
        <p className="text-[14px] text-muted">
          {c.anual(`$${fmtNumber(PRECIO_ANUAL_COACH)}`)} {c.prueba(DIAS_PRUEBA)}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>{c.preguntas}</SectionTitle>
        <GroupedList>
          {c.faq.map((q) => (
            <div key={q.p} className="flex flex-col gap-1 p-4">
              <p className="text-[16px] font-semibold">{q.p}</p>
              <p className="text-[14px] text-muted">{q.r}</p>
            </div>
          ))}
        </GroupedList>
      </section>

      <Link
        href="/registro/coach"
        className="flex h-12 items-center justify-center rounded-full bg-primary px-5 text-[16px] font-semibold text-primary-foreground transition active:scale-[0.98]"
      >
        {c.cta}
      </Link>

      <LegalFooter t={t} />
    </div>
  );
}
