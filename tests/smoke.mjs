/**
 * Smoke test: creates a throwaway account straight in the DB, drives the
 * main flows in a real browser, and deletes the account (cascade) at the end.
 *
 *   node --env-file=.env.local tests/smoke.mjs            # against http://localhost:3000
 *   BASE_URL=https://workout-eight-neon.vercel.app node --env-file=.env.local tests/smoke.mjs
 *
 * Needs DATABASE_URL and a Chromium for Playwright (`npx playwright install chromium`).
 */
import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const sql = neon(process.env.DATABASE_URL);
const username = `smoke_${Date.now().toString(36)}`;
const password = "smoke1234";

const results = [];
function check(name, ok, extra = "") {
  results.push({ name, ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
}

async function createUser() {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  const [u] = await sql`insert into users (username, password_hash) values (${username}, ${salt + ":" + hash}) returning id`;
  return u.id;
}

async function main() {
  const userId = await createUser();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    check("unauthenticated → /login", page.url().endsWith("/login"));

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForURL(`${BASE}/`), page.click('button[type="submit"]')]);
    check("login", page.url() === `${BASE}/`);

    await page.goto(`${BASE}/rutinas`, { waitUntil: "networkidle" });
    await page.fill('input[name="name"]', "Smoke Push");
    await Promise.all([page.waitForURL(/\/rutinas\/[0-9a-f-]{36}$/), page.click("text=Crear rutina")]);
    check("create routine", /\/rutinas\/[0-9a-f-]{36}$/.test(page.url()));
    const routineUrl = page.url();

    await page.fill('input[placeholder^="Buscar"]', "press de banca");
    await page.waitForTimeout(1000);
    const cards = await page.locator(".grid button[type=button]").count();
    check("search in Spanish", cards > 0, `${cards} resultados`);
    await page.locator(".grid button[type=button]").first().click();
    await page.click("text=Agregar a la rutina");
    await page.waitForTimeout(1500);
    check("add exercise", (await page.textContent("body")).includes("Empezar entrenamiento"));

    await page.click("text=Empezar entrenamiento");
    await page.waitForURL(/\/entrenar\//);
    await page.waitForTimeout(500);
    await page.locator('input[name="load"]').first().fill("40");
    await page.locator('input[name="reps"]').first().fill("10");
    await page.locator("form[data-exercise] button[type=submit]").first().click();
    await page.waitForFunction(() => !document.querySelector('button[aria-label="Guardando serie"]'), null, { timeout: 15000 });
    await page.waitForTimeout(500);
    const done = await page.locator("form[data-exercise] button.bg-primary").count();
    check("log a set", done >= 1);

    await page.click("text=Terminar entrenamiento");
    await page.waitForURL(/\/progreso/);
    check("finish session → progreso", (await page.textContent("body")).includes("Smoke Push"));

    await page.goto(`${BASE}/perfil`, { waitUntil: "networkidle" });
    check("perfil loads", (await page.textContent("body")).includes(username));

    await page.goto(routineUrl, { waitUntil: "networkidle" });
    await page.click("text=Eliminar rutina");
    await Promise.all([page.waitForURL(`${BASE}/rutinas`), page.click("text=Sí, eliminar")]);
    check("delete routine", page.url() === `${BASE}/rutinas`);
  } catch (err) {
    check("unexpected error", false, String(err).slice(0, 200));
  } finally {
    await browser.close();
    await sql`delete from users where id = ${userId}`;
    console.log(`cleanup: deleted ${username}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main();
