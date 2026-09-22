import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Card, Input, PrimaryButton } from "@/components/ui";
import { registerAction } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Usuario de 3 a 40 caracteres (letras, números, . _ @ -) y contraseña de 4 a 128.",
  taken: "Ese usuario ya existe, elige otro.",
};

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[85vh] flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-card bg-primary text-primary-foreground shadow-hero">
          <Dumbbell className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.02em]">Crea tu cuenta</h1>
          <p className="text-[15px] text-muted">Solo un usuario y una contraseña.</p>
        </div>
      </div>

      <Card className="p-4">
        <form action={registerAction} className="flex flex-col gap-3">
          {error && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
              {ERROR_MESSAGES[error] ?? "Algo salió mal, intenta de nuevo."}
            </p>
          )}

          <label className="label flex flex-col gap-1.5 text-muted">
            Usuario
            <Input
              name="username"
              required
              minLength={3}
              autoCapitalize="none"
              autoComplete="username"
            />
          </label>

          <label className="label flex flex-col gap-1.5 text-muted">
            Contraseña
            <Input
              name="password"
              type="password"
              required
              minLength={4}
              autoComplete="new-password"
            />
          </label>

          <PrimaryButton type="submit" className="mt-1">
            Crear cuenta
          </PrimaryButton>

          <p className="text-center text-[12px] text-muted">
            No pedimos correo: si olvidas la contraseña no hay forma de recuperarla. Guárdala bien.
          </p>
        </form>
      </Card>

      <p className="text-center text-[15px] text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
