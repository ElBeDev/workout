export default function RutinasPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis rutinas</h1>
        <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          + Nueva
        </button>
      </header>

      <p className="text-sm text-black/60 dark:text-white/60">
        Aquí van a vivir tus rutinas (Push Day, Piernas, etc.). Todavía no hay
        ninguna creada — esto se conecta a la base de datos en el siguiente
        paso.
      </p>
    </div>
  );
}
