/**
 * Mirrors into Vercel Blob the gifs of every exercise that is actually in
 * use (in a routine or logged in a session). Needs BLOB_READ_WRITE_TOKEN
 * and DATABASE_URL in the environment:
 *   node --env-file=.env.local ./node_modules/.bin/tsx scripts/mirror-gifs.ts
 * Pass --all to mirror the whole catalog instead.
 */
import { isNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import { exercises } from "../src/db/schema";
import { blobConfigured, mirrorExerciseGif } from "../src/lib/blob";

async function main() {
  if (!blobConfigured()) {
    console.error("BLOB_READ_WRITE_TOKEN is not set.");
    process.exit(1);
  }
  const all = process.argv.includes("--all");
  const rows = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(
      all
        ? isNull(exercises.gifBlobUrl)
        : sql`${exercises.gifBlobUrl} is null and ${exercises.gifUrl} is not null and (
            exists (select 1 from routine_exercises re where re.exercise_id = ${exercises.id})
            or exists (select 1 from set_logs sl where sl.exercise_id = ${exercises.id}))`
    );
  console.log(`Mirroring ${rows.length} gifs...`);
  let ok = 0;
  for (const row of rows) {
    const url = await mirrorExerciseGif(row.id);
    if (url) ok += 1;
    else console.log(`  skipped: ${row.name}`);
  }
  console.log(`Done: ${ok}/${rows.length} mirrored.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
