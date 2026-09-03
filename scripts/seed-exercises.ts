import { db } from "../src/db";
import { exercises } from "../src/db/schema";
import { sql } from "drizzle-orm";

const API_BASE = "https://oss.exercisedb.dev/api/v1/exercises";

type ApiExercise = {
  exerciseId: string;
  name: string;
  gifUrl: string;
  bodyParts: string[];
  equipments: string[];
  instructions: string[];
};

type ApiResponse = {
  meta: { hasNextPage: boolean; nextCursor: string | null };
  data: ApiExercise[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(url: URL, attempt = 1): Promise<ApiResponse> {
  const res = await fetch(url);
  if (res.status === 429) {
    if (attempt > 6) throw new Error("ExerciseDB rate limit: too many retries");
    const wait = 2000 * attempt;
    console.log(`Rate limited, waiting ${wait}ms (attempt ${attempt})...`);
    await sleep(wait);
    return fetchPage(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`ExerciseDB request failed: ${res.status}`);
  return (await res.json()) as ApiResponse;
}

async function fetchAllExercises(): Promise<ApiExercise[]> {
  const all: ApiExercise[] = [];
  let cursor: string | null = null;

  for (;;) {
    const url = new URL(API_BASE);
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("after", cursor);
    const body = await fetchPage(url);
    all.push(...body.data);
    console.log(`Fetched ${all.length} so far...`);

    if (!body.meta.hasNextPage) break;
    cursor = body.meta.nextCursor;
    await sleep(400);
  }

  return all;
}

async function main() {
  console.log("Fetching exercises from ExerciseDB...");
  const apiExercises = await fetchAllExercises();
  console.log(`Fetched ${apiExercises.length} exercises. Inserting...`);

  const rows = apiExercises.map((e) => ({
    name: e.name,
    bodyPart: e.bodyParts?.[0] ?? null,
    equipment: e.equipments?.[0] ?? null,
    gifUrl: e.gifUrl,
    instructions: e.instructions?.join(" ") ?? null,
    externalId: e.exerciseId,
  }));

  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await db
      .insert(exercises)
      .values(batch)
      .onConflictDoNothing({ target: exercises.externalId });
    console.log(`Inserted ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }

  const result = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from exercises`
  );
  console.log(`Done. Total rows in exercises table: ${result.rows[0].count}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
