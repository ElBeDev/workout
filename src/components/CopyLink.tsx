"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/i18n/client";

/** Copia la liga de invitar del coach al portapapeles y lo confirma un momento. */
export function CopyLink({ url }: { url: string }) {
  const t = useT();
  const [copiada, setCopiada] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopiada(true);
          setTimeout(() => setCopiada(false), 2000);
        } catch {
          // Sin permiso de portapapeles: la liga sigue a la vista para copiarla a mano.
        }
      }}
      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 text-[15px] font-semibold text-foreground transition active:scale-[0.98]"
    >
      {copiada ? <Check className="h-4 w-4 text-sets" /> : <Copy className="h-4 w-4" />}
      {copiada ? t.vinculos.panel.copiada : t.vinculos.panel.copiarLiga}
    </button>
  );
}
