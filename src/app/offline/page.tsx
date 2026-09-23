import { WifiOff } from "lucide-react";
import { Card } from "@/components/ui";
import { getDict } from "@/i18n";

export default async function OfflinePage() {
  const t = await getDict();
  return (
    <div className="flex min-h-[70vh] flex-col justify-center">
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
          <WifiOff className="h-6 w-6" />
        </div>
        <p className="text-[20px] font-bold tracking-[-0.02em]">{t.comun.sinConexion.titulo}</p>
        <p className="text-[15px] text-muted">{t.comun.sinConexion.descripcion}</p>
      </Card>
    </div>
  );
}
