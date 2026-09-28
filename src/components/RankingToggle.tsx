"use client";

import { useOptimistic, useTransition } from "react";
import { Trophy } from "lucide-react";
import { useT } from "@/i18n/client";
import { setShowInRanking } from "@/app/perfil/actions";

/** Aparecer o no en el ranking y en las tablas de los retos. Se guarda por cuenta. */
export function RankingToggle({ activo }: { activo: boolean }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [valor, setValor] = useOptimistic(activo);

  function alternar() {
    startTransition(async () => {
      setValor(!valor);
      await setShowInRanking(!valor);
    });
  }

  return (
    <div className="flex items-center gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
        <Trophy className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold">{t.perfil.ranking.aparecer}</span>
        <span className="block text-[13px] text-muted">{t.perfil.ranking.aparecerDescripcion}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={valor}
        aria-label={t.perfil.ranking.aparecer}
        onClick={alternar}
        disabled={pending}
        className={`relative h-8 w-[52px] shrink-0 rounded-full transition ${
          valor ? "bg-sets" : "bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
            valor ? "left-[24px]" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
