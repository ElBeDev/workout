export default function ProgresoPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Progreso</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Historial de sesiones y gráficas de peso/reps por ejercicio.
        </p>
      </header>

      <p className="text-sm text-black/60 dark:text-white/60">
        Todavía no tienes sesiones registradas.
      </p>
    </div>
  );
}
