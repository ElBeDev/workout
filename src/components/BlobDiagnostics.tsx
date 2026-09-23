"use client";

import { useState } from "react";
import { Check, Loader2, Stethoscope, X } from "lucide-react";
import { diagnoseBlob } from "@/app/admin/actions";
import { useT } from "@/i18n/client";

type Result = Awaited<ReturnType<typeof diagnoseBlob>>;

/** Diagnóstico del respaldo de gifs: dice cuál de las tres piezas falla. */
export function BlobDiagnostics() {
  const t = useT();
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      setResult(await diagnoseBlob());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-surface-2 text-[15px] font-semibold text-foreground transition active:scale-[0.98] disabled:opacity-60"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stethoscope className="h-4 w-4" />}
        {running ? t.admin.diagnostico.revisando : t.admin.diagnostico.boton}
      </button>

      {error && <p className="text-[13px] text-danger">{error}</p>}

      {result && (
        <dl className="flex flex-col gap-2 rounded-tile bg-surface-2 p-3 text-[13px]">
          <Row
            label={t.admin.diagnostico.token}
            ok={result.token}
            value={result.token ? t.admin.diagnostico.presente : t.admin.diagnostico.ausente}
          />
          <Row
            label={t.admin.diagnostico.acceso}
            ok={result.acceso.includes("dinámico 0") === false}
            value={result.acceso}
          />
          <Row
            label={t.admin.diagnostico.claves}
            ok={result.claves.includes("TOKEN")}
            value={result.claves}
          />
          <Row
            label={t.admin.diagnostico.descarga}
            ok={result.download.startsWith("ok")}
            value={result.download}
          />
          <Row
            label={t.admin.diagnostico.subida}
            ok={result.upload.startsWith("ok")}
            value={result.upload}
          />
          <Row label={t.admin.diagnostico.conCopia} ok={result.copias > 0} value={String(result.copias)} />
          <Row label={t.admin.diagnostico.pendientes} ok value={String(result.pendientes)} />
        </dl>
      )}
    </div>
  );
}

function Row({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="flex items-start gap-2">
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-sets" />
      ) : (
        <X className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
      )}
      <dt className="shrink-0 font-semibold">{label}:</dt>
      <dd className="min-w-0 break-all text-muted">{value}</dd>
    </div>
  );
}
