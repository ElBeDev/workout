import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Agent, fetch as undiciFetch } from "undici";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Cada consulta del driver HTTP de Neon es un `fetch`. Con el `fetch` global
 * de Node, las consultas que una página lanza en paralelo (`Promise.all`)
 * terminaban una tras otra: después de la primera ronda todas viajaban por una
 * sola conexión, y Progreso tardaba lo de 11 consultas seguidas (medido el
 * 2026-10-15, ver PLAN.md, notas de infra). Un pool propio con varias
 * conexiones HTTP/1.1 vivas las deja ir de verdad en paralelo.
 */
const pool = new Agent({ connections: 16, keepAliveTimeout: 30_000, allowH2: false });

neonConfig.fetchFunction = async (url: string, init: RequestInit) => {
  const inicio = process.env.DB_TRACE ? performance.now() : 0;
  const res = await undiciFetch(url, { ...(init as object), dispatcher: pool } as Parameters<typeof undiciFetch>[1]);
  // DB_TRACE=1 al arrancar el servidor imprime cuánto tardó cada consulta.
  if (process.env.DB_TRACE) {
    let q = "";
    try {
      const body = JSON.parse(String(init.body));
      q = String(body.query ?? body.queries?.map((x: { query: string }) => x.query).join(" ;; ") ?? "");
    } catch {}
    console.log(`[db] ${(performance.now() - inicio).toFixed(0)}ms ${q.replace(/\s+/g, " ").slice(0, 90)}`);
  }
  return res as unknown as Response;
};

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
