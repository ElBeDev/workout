import { cookies } from "next/headers";

/**
 * El código de la liga `/unirse/[code]` mientras la persona crea su cuenta o
 * inicia sesión (docs/coaches.md §4.5). Una hora basta para registrarse; se
 * borra en cuanto se usa. Escribirla y borrarla sólo funciona en una server
 * action o un route handler.
 */
const COOKIE = "invitacion";

export async function guardarInvitacion(code: string) {
  (await cookies()).set(COOKIE, code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
}

/** Lee la invitación pendiente sin borrarla (para pintar "te vas a unir a…"). */
export async function leerInvitacion(): Promise<string | null> {
  return (await cookies()).get(COOKIE)?.value ?? null;
}

/** Lee y borra la invitación pendiente, si hay. */
export async function tomarInvitacion(): Promise<string | null> {
  const store = await cookies();
  const code = store.get(COOKIE)?.value ?? null;
  if (code) store.delete(COOKIE);
  return code;
}
