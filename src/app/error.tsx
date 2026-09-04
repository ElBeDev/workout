"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Card, PrimaryButton } from "@/components/ui";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="mt-10 flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <p className="text-[16px] font-semibold">Algo salió mal</p>
      <p className="text-sm text-muted">Puede ser la señal. Inténtalo de nuevo.</p>
      <PrimaryButton type="button" onClick={reset} className="mt-2">
        <RotateCcw className="h-4 w-4" />
        Reintentar
      </PrimaryButton>
    </Card>
  );
}
