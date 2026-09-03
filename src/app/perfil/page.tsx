import { UserCircle } from "lucide-react";

export default function PerfilPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
      </header>

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-surface p-8 text-center shadow-sm dark:border-white/10">
        <UserCircle className="h-12 w-12 text-black/20 dark:text-white/20" />
        <p className="text-sm text-black/50 dark:text-white/50">
          El login todavía no está listo — por ahora la app funciona con un
          solo usuario.
        </p>
      </section>
    </div>
  );
}
