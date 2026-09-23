"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DICCIONARIOS, type Dict } from "./dicts";
import type { Locale } from "./locale";

const Ctx = createContext<Locale>("es");

/**
 * Sólo viaja el idioma (un string): el diccionario tiene funciones para los
 * textos con números y plurales, y React no puede serializar funciones a
 * través de la frontera servidor→cliente. Cada lado lo importa de `dicts`.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useT(): Dict {
  return DICCIONARIOS[useContext(Ctx)];
}

export function useLocale(): Locale {
  return useContext(Ctx);
}
