import { getLocale } from "./locale";
import { DICCIONARIOS, type Dict } from "./dicts";

export async function getDict(): Promise<Dict> {
  return DICCIONARIOS[await getLocale()];
}

export { DICCIONARIOS, type Dict } from "./dicts";
export { getLocale, LOCALE_COOKIE, LOCALES, type Locale } from "./locale";
