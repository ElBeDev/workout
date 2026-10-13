/**
 * Re-traduce sólo lo que cambió de reglas, sin pisar los `name_es` editados a
 * mano (que `translate-exercises.ts` sí pisaría). Una fila se actualiza si su
 * `name_es` sigue siendo la salida del traductor VIEJO y el NUEVO da otra cosa.
 *
 *   git show HEAD:src/lib/translate-exercise.ts > /tmp/translate-old.ts
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/retranslate-changed.ts /tmp/translate-old.ts           # sólo muestra
 *   node --env-file=.env.local node_modules/.bin/tsx scripts/retranslate-changed.ts /tmp/translate-old.ts --apply   # escribe
 */
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { exercises } from "../src/db/schema";
import { translateExerciseName as nuevo } from "../src/lib/translate-exercise";

async function main() {
  const [oldPath, flag] = process.argv.slice(2);
  if (!oldPath) throw new Error("Falta la ruta al traductor viejo (ver el comentario de arriba).");
  const { translateExerciseName: viejo } = await import(pathToFileURL(resolve(oldPath)).href);

  const rows = await db
    .select({ id: exercises.id, name: exercises.name, nameEs: exercises.nameEs })
    .from(exercises)
    .where(eq(exercises.isCustom, false));
  const changed = rows
    .map((r) => ({ ...r, antes: viejo(r.name) as string, despues: nuevo(r.name) }))
    .filter((r) => r.antes !== r.despues);
  const auto = changed.filter((r) => r.nameEs === r.antes);
  const manual = changed.filter((r) => r.nameEs !== r.antes);

  for (const r of auto) console.log(`${r.name.padEnd(50)} ${r.nameEs}  →  ${r.despues}`);
  for (const r of manual) console.log(`(a mano, no se toca) ${r.name}: ${r.nameEs}`);
  console.log(`${auto.length} por actualizar, ${manual.length} editados a mano.`);

  if (flag !== "--apply") return;
  for (const r of auto) await db.update(exercises).set({ nameEs: r.despues }).where(eq(exercises.id, r.id));
  console.log("Aplicado.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
