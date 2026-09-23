import { cookies } from "next/headers";

export type Locale = "es" | "en";

export const LOCALE_COOKIE = "workout:idioma";
export const LOCALES: Locale[] = ["es", "en"];

/**
 * El idioma viaja en cookie, no en localStorage: casi todas las pantallas son
 * componentes de servidor y tienen que renderizar en el idioma correcto de una
 * vez. Con localStorage la página llegaría en español y cambiaría al hidratar,
 * o sea un parpadeo en cada carga (ver docs/siguiente-ronda.md §3).
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(LOCALE_COOKIE)?.value === "en" ? "en" : "es";
}
