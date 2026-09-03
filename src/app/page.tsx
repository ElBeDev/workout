export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Hoy</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Tu entrenamiento de hoy aparecerá aquí.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <p className="text-sm text-black/60 dark:text-white/60">
          Todavía no tienes rutinas. Crea una para empezar.
        </p>
        <a
          href="/rutinas"
          className="mt-3 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Crear rutina
        </a>
      </section>
    </div>
  );
}
