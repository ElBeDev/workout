import { WifiOff } from "lucide-react";
import { Card } from "@/components/ui";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
          <WifiOff className="h-6 w-6" />
        </div>
        <p className="text-[20px] font-bold tracking-[-0.02em]">Sin conexión</p>
        <p className="text-[15px] text-muted">
          Esta pantalla no se había abierto antes, así que no está guardada. Las que ya visitaste
          sí se abren sin señal; los cambios se guardan cuando vuelva la conexión.
        </p>
      </Card>
    </div>
  );
}
