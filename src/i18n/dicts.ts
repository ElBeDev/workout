import { es } from "./es";
import { en } from "./en";
import type { Locale } from "./locale";

/**
 * Los diccionarios, sin nada de `next/headers`, para que los pueda importar
 * tanto el servidor como el cliente.
 *
 * El diccionario NO cruza la frontera servidor→cliente: tiene funciones (los
 * textos con números y plurales) y React no puede serializarlas. Lo que cruza
 * es sólo el idioma, un string, y cada lado elige de aquí.
 */
export type Dict = typeof es;

export const DICCIONARIOS: Record<Locale, Dict> = { es, en };
