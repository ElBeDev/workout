import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, Input, PrimaryButton } from "@/components/ui";
import { loginAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Usuario o contraseña incorrectos.",
  locked: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[85vh] flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(21,21,31,0.18)]">
          <Dumbbell className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">Workout</h1>
          <p className="text-sm text-muted">Inicia sesión para ver tus rutinas.</p>
        </div>
      </div>

      <Card className="p-4">
        <form action={loginAction} className="flex flex-col gap-3">
          {error && (
            <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[13px] font-medium text-danger">
              {ERROR_MESSAGES[error] ?? "Algo salió mal, intenta de nuevo."}
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
            Usuario
            <Input name="username" required autoCapitalize="none" autoComplete="username" />
          </label>

          <label className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
            Contraseña
            <Input name="password" type="password" required autoComplete="current-password" />
          </label>

          <PrimaryButton type="submit" className="mt-1">
            Entrar
          </PrimaryButton>
        </form>
      </Card>

      <p className="text-center text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-semibold text-foreground">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
