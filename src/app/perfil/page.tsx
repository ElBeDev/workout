import { eq } from "drizzle-orm";
import { UserCircle, LogOut } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUserId } from "@/lib/session";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const userId = await requireUserId();
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
      </header>

      <section className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 bg-surface p-8 text-center shadow-sm dark:border-white/10">
        <UserCircle className="h-12 w-12 text-black/20 dark:text-white/20" />
        <p className="text-sm font-medium">{user?.username}</p>
      </section>

      <form action={logoutAction}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-3 text-sm font-medium text-red-500 dark:border-white/10"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
