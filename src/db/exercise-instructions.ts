import { sql } from "drizzle-orm";
import { exercises } from "@/db/schema";

/**
 * Los pasos a mostrar: la traducción al español si existe, y si no el original
 * en inglés de ExerciseDB. Mismo patrón que `exerciseGif`, para que ninguna
 * pantalla tenga que acordarse de elegir.
 *
 * Cuando la app sea bilingüe (punto 3 de docs/siguiente-ronda.md) esto pasará a
 * elegir por idioma en vez de por disponibilidad.
 */
export const exerciseInstructions =
  sql<string | null>`coalesce(${exercises.instructionsEs}, ${exercises.instructions})`.as(
    "instructions"
  );
