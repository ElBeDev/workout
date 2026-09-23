"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages, Loader2 } from "lucide-react";
import { setLocale } from "@/i18n/actions";
import { useLocale, useT } from "@/i18n/client";

const OPCIONES = ["es", "en"] as const;

/** Selector de idioma. Además de cambiar la cookie hay que tirar el cache de
 *  páginas del service worker: guarda HTML ya renderizado y serviría la página
 *  en el idioma anterior hasta que caduque. */
export function LanguageSwitch() {
  const t = useT();
  const actual = useLocale();
  const etiquetas = { es: t.perfil.idioma.espanol, en: t.perfil.idioma.ingles };
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  function elegir(id: string) {
    if (id === actual) return;
    startTransition(async () => {
      await setLocale(id);
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.filter((k) => k.startsWith("pages-")).map((k) => caches.delete(k)));
        }
        navigator.serviceWorker?.controller?.postMessage({ type: "purge-pages" });
      } catch {}
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1 rounded-full bg-surface-2 p-1">
      {OPCIONES.map((id) => {
        const activo = actual === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => elegir(id)}
            aria-pressed={activo}
            disabled={pendiente}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-[14px] font-semibold transition disabled:opacity-60 ${
              activo ? "bg-surface text-foreground shadow-hero" : "text-muted"
            }`}
          >
            {pendiente && activo ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            {etiquetas[id]}
          </button>
        );
      })}
    </div>
  );
}
