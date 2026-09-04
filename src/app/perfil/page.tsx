import { desc, eq } from "drizzle-orm";
import { LogOut, KeyRound, Scale, Trash2, Plus, ShieldAlert, Timer, Check, Download } from "lucide-react";
import { db } from "@/db";
import { users, bodyWeights } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { Card, Input, PageHeader, PrimaryButton, SecondaryButton, SectionTitle } from "@/components/ui";
import { BodyWeightChart } from "@/components/BodyWeightChart";
import { logoutAction } from "../login/actions";
import { changePasswordAction, addBodyWeight, deleteBodyWeight, setDefaultRest } from "./actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  short: "La contraseña nueva debe tener al menos 4 caracteres.",
  mismatch: "Las contraseñas nuevas no coinciden.",
  wrong: "La contraseña actual no es correcta.",
};

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const userId = await requireUserId();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const initial = (user?.username ?? "?").charAt(0).toUpperCase();

  const weights = await db
    .select()
    .from(bodyWeights)
    .where(eq(bodyWeights.userId, userId))
    .orderBy(desc(bodyWeights.loggedAt))
    .limit(30);

  const chart = [...weights]
    .reverse()
    .map((w) => ({
      date: new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(w.loggedAt),
      weight: Number(w.weight),
    }));
  const latest = weights[0] ? Number(weights[0].weight) : null;
  const first = weights.length > 1 ? Number(weights[weights.length - 1].weight) : null;
  const delta = latest !== null && first !== null ? Math.round((latest - first) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Perfil" />

      <Card className="flex items-center gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-[26px] font-bold text-accent-foreground">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold capitalize">{user?.username}</p>
          {user?.createdAt && (
            <p className="text-[13px] text-muted">
              Desde{" "}
              {new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(
                user.createdAt
              )}
            </p>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-muted" /> Peso corporal
        </SectionTitle>

        {latest !== null && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-accent p-3 text-accent-foreground">
              <p className="text-[22px] font-bold leading-none tabular-nums">
                {latest}
                <span className="ml-1 text-[12px] font-medium opacity-70">kg</span>
              </p>
              <p className="mt-1 text-[11px] opacity-70">Último registro</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-3">
              <p className="text-[22px] font-bold leading-none tabular-nums">
                {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                <span className="ml-1 text-[12px] font-medium text-muted">kg</span>
              </p>
              <p className="mt-1 text-[11px] text-muted">Desde el primero</p>
            </div>
          </div>
        )}

        {chart.length > 1 && <BodyWeightChart data={chart} />}

        <form action={addBodyWeight} className="flex gap-2">
          <Input
            name="weight"
            type="number"
            step="0.1"
            inputMode="decimal"
            placeholder="Peso de hoy (kg)"
            required
            className="flex-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="submit"
            aria-label="Guardar peso"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </form>

        {weights.length > 0 && (
          <ul className="flex flex-col gap-1">
            {weights.slice(0, 5).map((w) => (
              <li key={w.id} className="flex items-center justify-between text-[14px]">
                <span className="text-muted">
                  {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(w.loggedAt)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{Number(w.weight)} kg</span>
                  <form action={deleteBodyWeight.bind(null, w.id)}>
                    <button
                      type="submit"
                      aria-label="Borrar registro"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted" /> Descanso entre series
        </SectionTitle>
        <p className="text-[13px] text-muted">
          Tiempo por defecto del cronómetro. Cada ejercicio puede tener el suyo desde la rutina.
        </p>
        <form action={setDefaultRest} className="flex gap-2">
          <Input
            name="restSeconds"
            type="number"
            min={10}
            max={900}
            step={5}
            inputMode="numeric"
            defaultValue={user?.restSeconds ?? 90}
            className="flex-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="flex items-center text-[14px] text-muted">segundos</span>
          <button
            type="submit"
            aria-label="Guardar descanso"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </form>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted" /> Cambiar contraseña
        </SectionTitle>

        {error && ERRORS[error] && (
          <p className="rounded-2xl bg-danger/10 px-4 py-3 text-[13px] font-medium text-danger">
            {ERRORS[error]}
          </p>
        )}
        {ok === "password" && (
          <p className="rounded-2xl bg-accent px-4 py-3 text-[13px] font-medium text-accent-foreground">
            Contraseña actualizada.
          </p>
        )}

        <form action={changePasswordAction} className="flex flex-col gap-2">
          <Input name="current" type="password" placeholder="Contraseña actual" required autoComplete="current-password" />
          <Input name="next" type="password" placeholder="Nueva contraseña" required minLength={4} autoComplete="new-password" />
          <Input name="confirm" type="password" placeholder="Repite la nueva" required minLength={4} autoComplete="new-password" />
          <PrimaryButton type="submit" className="mt-1">Actualizar contraseña</PrimaryButton>
        </form>

        <p className="flex items-start gap-2 text-[12px] text-muted">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No pedimos correo, así que no hay forma de recuperar la contraseña si la olvidas. Guárdala en un lugar seguro.
        </p>
      </Card>

      <a
        href="/api/export"
        download
        className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3.5 text-[15px] font-medium text-foreground"
      >
        <Download className="h-4 w-4" />
        Exportar historial (CSV)
      </a>

      <form action={logoutAction}>
        <SecondaryButton type="submit" className="w-full text-danger">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </SecondaryButton>
      </form>
    </div>
  );
}
