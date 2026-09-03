import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { loginAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Usuario o contraseña incorrectos.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[80vh] flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Dumbbell className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Workout</h1>
        <p className="text-sm text-black/50 dark:text-white/50">
          Inicia sesión para ver tus rutinas.
        </p>
      </div>

      <form
        action={loginAction}
        className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-surface p-4 shadow-sm dark:border-white/10"
      >
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {ERROR_MESSAGES[error] ?? "Algo salió mal, intenta de nuevo."}
          </p>
        )}

        <label className="flex flex-col gap-1 text-xs text-black/50 dark:text-white/50">
          Usuario
          <input
            name="username"
            required
            autoCapitalize="none"
            autoComplete="username"
            className="rounded-xl border border-black/10 px-4 py-3 text-sm text-foreground dark:border-white/10 dark:bg-transparent"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-black/50 dark:text-white/50">
          Contraseña
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-xl border border-black/10 px-4 py-3 text-sm text-foreground dark:border-white/10 dark:bg-transparent"
          />
        </label>

        <button
          type="submit"
          className="mt-1 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm active:scale-[0.98]"
        >
          Entrar
        </button>
      </form>

      <p className="text-center text-sm text-black/50 dark:text-white/50">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-accent">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
