import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | undefined;

// Lazy on purpose: Next.js imports route modules (to read their config)
// during `next build`, before real env vars for the target environment are
// necessarily what you'd expect at runtime. Throwing eagerly at import time
// broke the Vercel build even though DATABASE_URL is set for the deploy.
// This way the error only surfaces if a request actually hits the DB.
function getDb(): Db {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Add it in your environment (.env.local or Vercel project settings)."
      );
    }
    _db = drizzle(neon(process.env.DATABASE_URL), { schema });
  }
  return _db;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
