import { db } from "../src/db";
import { exercises } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { translateExerciseName } from "../src/lib/translate-exercise";

async function main() {
  const rows = await db.select({ id: exercises.id, name: exercises.name }).from(exercises);
  console.log(`Translating ${rows.length} names...`);

  const chunk = 25;
  for (let i = 0; i < rows.length; i += chunk) {
    await Promise.all(
      rows.slice(i, i + chunk).map((row) =>
        db
          .update(exercises)
          .set({ nameEs: translateExerciseName(row.name) })
          .where(eq(exercises.id, row.id))
      )
    );
    if ((i / chunk) % 10 === 0) console.log(`${Math.min(i + chunk, rows.length)}/${rows.length}`);
  }
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
