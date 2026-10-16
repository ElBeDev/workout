/**
 * Lo que se ve en cuanto tocas algo, mientras el servidor arma la pantalla
 * (docs/PLAN.md, notas de infra, 2026-10-15). Sin esto, Next no muestra nada
 * ni precarga las páginas dinámicas: el botón parecía no responder. La barra
 * de abajo vive en el layout y sigue funcionando mientras carga.
 */
export default function Loading() {
  const bloque = "animate-pulse rounded-card bg-surface-2";
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-2 pt-11">
        <div className="h-9 w-2/3 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-4 w-1/2 animate-pulse rounded-lg bg-surface-2" />
      </div>
      <div className={`h-40 ${bloque}`} />
      <div className="grid grid-cols-2 gap-3">
        <div className={`h-24 ${bloque}`} />
        <div className={`h-24 ${bloque}`} />
      </div>
      <div className={`h-56 ${bloque}`} />
    </div>
  );
}
