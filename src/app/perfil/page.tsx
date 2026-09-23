import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { KeyRound, Scale, Trash2, Plus, ShieldAlert, ShieldCheck, Download, ChevronRight, Target } from "lucide-react";
import { db } from "@/db";
import { users, bodyWeights } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { fmtDate } from "@/lib/dates";
import {
  Card,
  GroupedList,
  Input,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from "@/components/ui";
import { BodyWeightChart } from "@/components/BodyWeightChart";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { SoundToggle } from "@/components/SoundToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { changePasswordAction, addBodyWeight, deleteBodyWeight, updateGoals } from "./actions";

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
      date: fmtDate(w.loggedAt, { day: "2-digit", month: "short" }),
      weight: Number(w.weight),
    }));

  const latest = weights[0] ? Number(weights[0].weight) : null;
  const first = weights.length > 1 ? Number(weights[weights.length - 1].weight) : null;
  const delta = latest !== null && first !== null ? Math.round((latest - first) * 10) / 10 : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Perfil" />

      <Card className="flex items-center gap-4 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[26px] font-bold uppercase text-muted">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[22px] font-bold capitalize tracking-[-0.02em]">
            {user?.username}
          </p>
          {user?.createdAt && (
            <p className="text-[13px] text-muted">
              Desde {fmtDate(user.createdAt, { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </Card>

      <section className="flex flex-col gap-3">
        <SectionTitle>Apariencia y sonido</SectionTitle>
        <ThemeSwitch />
        <GroupedList>
          <SoundToggle />
        </GroupedList>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Metas de la semana</SectionTitle>
        <Card className="flex flex-col gap-3 p-4">
          <p className="text-[13px] text-muted">
            Son las tres metas de los anillos del Resumen. La carga no cuenta los ejercicios
            en placas (no hay forma de convertirlas a kilos).
          </p>
          <form action={updateGoals} className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <label className="label text-load">
                Carga (kg)
                <Input
                  name="volume"
                  type="number"
                  min={100}
                  step={100}
                  defaultValue={user?.goalWeeklyVolumeKg ?? 5000}
                  className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </label>
              <label className="label text-sets">
                Series
                <Input
                  name="sets"
                  type="number"
                  min={1}
                  defaultValue={user?.goalWeeklySets ?? 60}
                  className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </label>
              <label className="label text-days">
                Días
                <Input
                  name="days"
                  type="number"
                  min={1}
                  max={7}
                  defaultValue={user?.goalWeeklyDays ?? 4}
                  className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                />
              </label>
            </div>
            <SecondaryButton type="submit" className="w-full">
              <Target className="h-4 w-4" />
              Guardar metas
            </SecondaryButton>
          </form>
        </Card>
      </section>

      {user?.isAdmin && (
        <GroupedList>
          <Link href="/admin" className="flex items-center gap-3 p-4 transition active:bg-surface-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold">Panel de administrador</p>
              <p className="text-[13px] text-muted">Armar rutinas para cualquier usuario</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-faint" />
          </Link>
        </GroupedList>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <SectionTitle className="flex items-center gap-2">
          <Scale className="h-3.5 w-3.5" /> Peso corporal
        </SectionTitle>

        {latest !== null && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="label text-muted">Último registro</p>
              <p className="mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums">
                {latest}
                <span className="ml-1 text-[13px] font-semibold text-muted">kg</span>
              </p>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <p className="label text-muted">Desde el primero</p>
              <p
                className={`mt-1 text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums ${
                  delta === null || delta === 0 ? "" : delta > 0 ? "text-load" : "text-sets"
                }`}
              >
                {delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
                <span className="ml-1 text-[13px] font-semibold text-muted">kg</span>
              </p>
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
                  {fmtDate(w.loggedAt, { dateStyle: "medium" })}
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
          <KeyRound className="h-3.5 w-3.5" /> Cambiar contraseña
        </SectionTitle>

        {error && ERRORS[error] && (
          <p className="rounded-xl bg-danger/10 px-4 py-3 text-[14px] font-semibold text-danger">
            {ERRORS[error]}
          </p>
        )}
        {ok === "password" && (
          <p className="rounded-xl bg-sets/12 px-4 py-3 text-[14px] font-semibold text-sets">
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
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-surface-2 px-5 text-[15px] font-semibold text-foreground"
      >
        <Download className="h-4 w-4" />
        Exportar historial (CSV)
      </a>

      <LogoutButton />
    </div>
  );
}
