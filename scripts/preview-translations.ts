import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { exercises } from "../src/db/schema";
import { translateExerciseName } from "../src/lib/translate-exercise";

async function main() {
  const rows = await db.select({ name: exercises.name }).from(exercises).orderBy(sql`random()`).limit(30);
  const fixed = ["barbell bench press", "dumbbell incline bench press", "cable lateral raise", "lever leg extension", "barbell bent over row", "assisted pull-up", "push-up", "dumbbell hammer curl", "lat pulldown", "barbell romanian deadlift", "cable pushdown", "smith machine squat", "kettlebell swing", "plank", "hanging leg raise"];
  for (const n of [...fixed, ...rows.map((r) => r.name)]) console.log(n.padEnd(50), "→", translateExerciseName(n));
}
main().then(() => process.exit(0));
