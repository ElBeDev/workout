import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui";
import { LegalFooter } from "@/components/LegalFooter";
import { getDict } from "@/i18n";
import { getLocale } from "@/i18n/locale";
import { LEGAL_ACTUALIZADO, legalCompleto } from "@/lib/legal";

/**
 * Marco de /terminos y /privacidad: título, fecha, el aviso de borrador
 * mientras falten los datos del responsable, y las secciones. El texto va en
 * español siempre: lo rige la ley mexicana.
 */
export async function LegalPage({
  titulo,
  secciones,
}: {
  titulo: string;
  secciones: { titulo: string; cuerpo: ReactNode }[];
}) {
  const [t, locale] = await Promise.all([getDict(), getLocale()]);
  const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${LEGAL_ACTUALIZADO}T00:00:00Z`)
  );
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeader title={titulo} subtitle={t.publico.legal.actualizado(fecha)} />
      {!legalCompleto() && (
        <p className="rounded-xl bg-warning/12 px-4 py-3 text-[14px] font-semibold text-warning">
          {t.publico.legal.borrador}
        </p>
      )}
      {locale !== "es" && t.publico.legal.soloEspanol && (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-[14px] text-muted">{t.publico.legal.soloEspanol}</p>
      )}
      <div lang="es" className="flex flex-col gap-6">
        {secciones.map((s, i) => (
          <section key={s.titulo} className="flex flex-col gap-2">
            <h2 className="text-[19px] font-bold tracking-[-0.01em]">
              {i + 1}. {s.titulo}
            </h2>
            <div className="flex flex-col gap-2 text-[15px] leading-relaxed text-foreground/90 [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
              {s.cuerpo}
            </div>
          </section>
        ))}
      </div>
      <LegalFooter t={t} />
    </div>
  );
}
