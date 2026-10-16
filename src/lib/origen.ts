import { headers } from "next/headers";

/**
 * La dirección pública de la app tal como la pidió el navegador, para armar
 * ligas absolutas (la de invitar del coach). En Vercel llega por
 * `x-forwarded-host`; en local es `localhost:3000` por http.
 */
export async function origen(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
