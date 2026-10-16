import Link from "next/link";
import { ElBeFit } from "@/components/ElBeFit";
import type { Dict } from "@/i18n";

/** Pie de las páginas públicas: términos, privacidad y quién hace la app. */
export function LegalFooter({ t }: { t: Dict }) {
  return (
    <footer className="flex flex-col items-center gap-2 text-center text-[13px] text-muted">
      <p className="flex gap-3">
        <Link href="/terminos" className="font-semibold">
          {t.publico.legal.terminos}
        </Link>
        <Link href="/privacidad" className="font-semibold">
          {t.publico.legal.privacidad}
        </Link>
      </p>
      <p>
        GainLine · {t.acceso.hechoPor} <ElBeFit className="text-[16px] text-foreground/70" />
      </p>
    </footer>
  );
}
