"use client";

import { WifiOff, RotateCcw } from "lucide-react";
import { Card, PrimaryButton } from "@/components/ui";
import { useT } from "@/i18n/client";

export default function EntrenarError({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <Card className="flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <WifiOff className="h-6 w-6" />
      </div>
      <p className="text-[16px] font-semibold">{t.entrenar.error.titulo}</p>
      <p className="text-sm text-muted">{t.entrenar.error.detalle}</p>
      <PrimaryButton type="button" onClick={reset} className="mt-2">
        <RotateCcw className="h-4 w-4" />
        {t.entrenar.error.reintentar}
      </PrimaryButton>
    </Card>
  );
}
