import Link from "next/link";
import type { Dict } from "@/i18n";

/** "Al crear tu cuenta aceptas…", bajo el botón de los dos registros (docs/coaches.md §8.3). */
export function Consentimiento({ t }: { t: Dict }) {
  const l = t.publico.legal;
  return (
    <p className="text-center text-[12px] text-muted">
      {l.aceptas}{" "}
      <Link href="/terminos" className="font-semibold text-accent">
        {l.terminos}
      </Link>{" "}
      {l.y}{" "}
      <Link href="/privacidad" className="font-semibold text-accent">
        {l.privacidad}
      </Link>
      .
    </p>
  );
}
