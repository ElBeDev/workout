"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, LOCALES, type Locale } from "./locale";

/** Cambia el idioma. Un año de vigencia y sin httpOnly: el service worker
 *  también necesita saberlo para no servir una página cacheada en el otro
 *  idioma. */
export async function setLocale(locale: string) {
  if (!LOCALES.includes(locale as Locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
