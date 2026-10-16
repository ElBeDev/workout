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
  // Oculta del ranking: corriendo contra producción, la cuenta desechable no
  // debe asomarse en la tabla de Retos que ven los socios reales.
  const [u] = await sql`insert into users (username, password_hash, show_in_ranking) values (${username}, ${salt + ":" + hash}, false) returning id`;
  return u.id;
}

/**
 * Aislamiento entre coaches (docs/coaches.md §11): el coach A no puede ver
 * nada del alumno del coach B, ni entrando a la URL directa; a su propio
 * alumno sí, aunque esté oculto del ranking. Y por grupos (§5): un alumno
 * visible de A sólo compite con su grupo y no ve la foto ni la tarjeta del
 * alumno de B. Ningún socio real las ve: cada coach desechable es su propio
 * grupo. Se borran al final.
 */
async function isolation(browser) {
  const tag = Date.now().toString(36);
  const salt = randomBytes(16).toString("hex");
  const hash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
  const mk = async (name, role, visible = false) => {
    const [u] = await sql`insert into users (username, password_hash, show_in_ranking, role) values (${`smoke_${name}_${tag}`}, ${hash}, ${visible}, ${role}) returning id, username`;
    return u;
  };
  const coachA = await mk("coacha", "coach");
  const coachB = await mk("coachb", "coach");
  const clientA = await mk("alumnoa", "member");
  const clientA2 = await mk("alumnoa2", "member", true);
  const clientB = await mk("alumnob", "member", true);
  const ids = [coachA.id, coachB.id, clientA.id, clientA2.id, clientB.id];
  try {
    await sql`insert into coaches (user_id, code, plan, billing_status) values (${coachA.id}, ${`SMK-A${tag}`}, 'comp', 'active'), (${coachB.id}, ${`SMK-B${tag}`}, 'comp', 'active')`;
    await sql`insert into coach_clients (coach_id, client_id, status, source, accepted_at) values (${coachA.id}, ${clientA.id}, 'active', 'migration', now()), (${coachA.id}, ${clientA2.id}, 'active', 'migration', now()), (${coachB.id}, ${clientB.id}, 'active', 'migration', now())`;
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    await sql`insert into user_avatars (user_id, image, mime) values (${clientA.id}, ${jpeg}, 'image/jpeg'), (${clientB.id}, ${jpeg}, 'image/jpeg')`;
    const [routineB] = await sql`insert into routines (user_id, name) values (${clientB.id}, 'Smoke B') returning id`;
    const [sessionB] = await sql`insert into workout_sessions (user_id, routine_id, finished_at) values (${clientB.id}, ${routineB.id}, now()) returning id`;

    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addCookies([{ name: "workout:idioma", value: "es", url: BASE }]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="username"]', coachA.username);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForURL(`${BASE}/`), page.click('button[type="submit"]')]);

    const status = async (path) => (await page.request.get(`${BASE}${path}`, { maxRedirects: 0 })).status();
    await page.goto(`${BASE}/coach`, { waitUntil: "networkidle" });
    const panel = await page.textContent("body");
    check("coach panel: only own members", panel.includes(clientA.username) && !panel.includes(clientB.username));
    check("own member visible", (await status(`/coach/usuarios/${clientA.id}`)) === 200);
    check("own hidden member's photo", (await status(`/api/avatar/${clientA.id}`)) === 200);
    const blocked = await Promise.all([
      status(`/coach/usuarios/${clientB.id}`),
      status(`/coach/usuarios/${clientB.id}/sesion/${sessionB.id}`),
      status(`/rutinas/${routineB.id}`),
      status(`/api/avatar/${clientB.id}`),
      status(`/retos/socio/${clientB.id}`),
    ]);
    check("other coach's member: 404 everywhere", blocked.every((s) => s === 404), blocked.join(","));
    await ctx.close();

    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx2.addCookies([{ name: "workout:idioma", value: "es", url: BASE }]);
    const page2 = await ctx2.newPage();
    await page2.goto(`${BASE}/login`);
    await page2.fill('input[name="username"]', clientA2.username);
    await page2.fill('input[name="password"]', password);
    await Promise.all([page2.waitForURL(`${BASE}/`), page2.click('button[type="submit"]')]);
    await page2.goto(`${BASE}/retos`, { waitUntil: "networkidle" });
    const board = (await page2.textContent("body")).toLowerCase();
    check(
      "ranking: only own group",
      board.includes(clientA2.username) && !board.includes(clientB.username) && !board.includes(coachA.username)
    );
    const other = await Promise.all(
      [`/retos/socio/${clientB.id}`, `/api/avatar/${clientB.id}`].map(
        async (path) => (await page2.request.get(`${BASE}${path}`, { maxRedirects: 0 })).status()
      )
    );
    check("other group's visible member: 404", other.every((s) => s === 404), other.join(","));
    await ctx2.close();
  } finally {
    await sql`delete from users where id = any(${ids})`;
    console.log(`cleanup: deleted the 5 isolation accounts`);
  }
}

/**
 * Coaches y vínculos (docs/coaches.md §4.5), como lo haría una persona: alta
 * de coach, alumno nuevo que entra por la liga, solicitud por usuario que el
 * coach acepta, copiar una rutina a los dos ("De tu coach") y dejar al coach.
 * Todo con un sufijo propio y borrado al final.
 */
async function coachFlow(browser) {
  const tag = Date.now().toString(36);
  const coachUser = `smoke_coach_${tag}`;
  const linkUser = `smoke_liga_${tag}`;
  const reqUser = `smoke_pide_${tag}`;
  const newPage = async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addCookies([{ name: "workout:idioma", value: "es", url: BASE }]);
    return { ctx, page: await ctx.newPage() };
  };
  const idOf = async (u) => (await sql`select id from users where username = ${u}`)[0]?.id;
  const link = async (coachId, clientId) =>
    (await sql`select status from coach_clients where coach_id = ${coachId} and client_id = ${clientId} order by created_at desc limit 1`)[0]?.status;
  try {
    // 1. Alta de coach
    const coach = await newPage();
    await coach.page.goto(`${BASE}/registro/coach`);
    await coach.page.fill('input[name="username"]', coachUser);
    await coach.page.fill('input[name="password"]', password);
    await coach.page.fill('input[name="brandName"]', "Smoke Fit");
    await Promise.all([coach.page.waitForURL(`${BASE}/coach`), coach.page.click("text=Crear cuenta de coach")]);
    const code = (await coach.page.textContent("body")).match(/GL-[0-9A-Z]{4}/)?.[0];
    check("coach signup → panel with code", Boolean(code), code ?? "");
    const coachId = await idOf(coachUser);

    // 2. Alumno nuevo por la liga
    const viaLink = await newPage();
    await viaLink.page.goto(`${BASE}/unirse/${code}`);
    await Promise.all([viaLink.page.waitForURL(`${BASE}/registro`), viaLink.page.click("text=Crear cuenta")]);
    check("join link → signup shows coach", (await viaLink.page.textContent("body")).includes("Entrena con"));
    await viaLink.page.fill('input[name="username"]', linkUser);
    await viaLink.page.fill('input[name="password"]', password);
    await Promise.all([viaLink.page.waitForURL(`${BASE}/`), viaLink.page.click('button[type="submit"]')]);
    const linkId = await idOf(linkUser);
    check("signup via link → linked", (await link(coachId, linkId)) === "active");

    // 3. Solicitud por usuario, aceptada por el coach
    const salt = randomBytes(16).toString("hex");
    await sql`insert into users (username, password_hash) values (${reqUser}, ${salt + ":" + scryptSync(password, salt, 64).toString("hex")})`;
    const reqId = await idOf(reqUser);
    const asks = await newPage();
    await asks.page.goto(`${BASE}/login`);
    await asks.page.fill('input[name="username"]', reqUser);
    await asks.page.fill('input[name="password"]', password);
    await Promise.all([asks.page.waitForURL(`${BASE}/`), asks.page.click('button[type="submit"]')]);
    await asks.page.goto(`${BASE}/perfil`);
    await asks.page.fill("#coach-username", coachUser);
    await Promise.all([asks.page.waitForURL(/coach=enviada/), asks.page.click("text=Pedir unirme")]);
    check("request by username → pending", (await link(coachId, reqId)) === "pending");
    await coach.page.goto(`${BASE}/coach`, { waitUntil: "networkidle" });
    await coach.page.click("text=Aceptar");
    // Se espera a la base y no al texto: los títulos de sección van en
    // mayúsculas por CSS y innerText las devuelve así.
    for (let i = 0; i < 30 && (await link(coachId, reqId)) !== "active"; i++) await new Promise((r) => setTimeout(r, 500));
    check("coach accepts → active", (await link(coachId, reqId)) === "active");
    await coach.page.goto(`${BASE}/coach`, { waitUntil: "networkidle" });
    const panel = await coach.page.textContent("body");
    check("panel lists both members", panel.includes(linkUser) && panel.includes(reqUser));

    // 4. Copiar una rutina del coach a los dos
    const [ex] = await sql`select id from exercises where user_id is null and name = 'lever leg extension'`;
    const [r] = await sql`insert into routines (user_id, name) values (${coachId}, 'Smoke Copia') returning id`;
    await sql`insert into routine_exercises (routine_id, exercise_id, sort_order, target_sets, target_reps) values (${r.id}, ${ex.id}, 0, 2, 12)`;
    await coach.page.goto(`${BASE}/coach/copiar/${r.id}`, { waitUntil: "networkidle" });
    for (const box of await coach.page.locator('input[name="clientId"]').all()) await box.check();
    await Promise.all([coach.page.waitForURL(/ok=2/), coach.page.click("button:has-text('Copiar')")]);
    const copias = await sql`select count(*)::int n from routines where created_by = ${coachId} and user_id in (${linkId}, ${reqId}) and name = 'Smoke Copia'`;
    check("copy routine to 2 members", copias[0].n === 2);
    await viaLink.page.goto(`${BASE}/rutinas`, { waitUntil: "networkidle" });
    check("member sees 'De tu coach'", (await viaLink.page.textContent("body")).includes("De tu coach"));

    // 5. Dejar al coach
    await asks.page.goto(`${BASE}/perfil`, { waitUntil: "networkidle" });
    await asks.page.click("text=Dejar a mi coach");
    await Promise.all([asks.page.waitForURL(/perfil/), asks.page.click("text=Sí, dejarlo")]);
    await asks.page.waitForFunction(() => document.body.innerText.includes("Entrenas por tu cuenta"), null, { timeout: 15000 });
    check("member leaves coach → ended", (await link(coachId, reqId)) === "ended");

    for (const p of [coach, viaLink, asks]) await p.ctx.close();
  } finally {
    await sql`delete from users where username in (${coachUser}, ${linkUser}, ${reqUser})`;
    console.log("cleanup: deleted the 3 coach-flow accounts");
  }
}

async function main() {
  const userId = await createUser();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // La suite busca textos en español: se fija el idioma para que no dependa de
  // la preferencia del navegador ni se caiga cuando la app está en inglés.
  await ctx.addCookies([{ name: "workout:idioma", value: "es", url: BASE }]);
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    check("unauthenticated → /login", page.url().endsWith("/login"));

    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForURL(`${BASE}/`), page.click('button[type="submit"]')]);
    check("login", page.url() === `${BASE}/`);

    await page.goto(`${BASE}/rutinas`, { waitUntil: "networkidle" });
    await page.click('button[aria-label="Nueva rutina"]');
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', "Smoke Push");
    await Promise.all([page.waitForURL(/\/rutinas\/[0-9a-f-]{36}$/), page.click("text=Crear rutina")]);
    check("create routine", /\/rutinas\/[0-9a-f-]{36}$/.test(page.url()));
    const routineUrl = page.url();

    await page.click("text=Agregar ejercicio");
    await page.waitForSelector('input[placeholder^="Buscar"]');
    // The picker already shows a browse list before typing, so "a card
    // appeared" proves nothing: wait for this query's response, then for
    // cards that actually match it. A fixed 1 s wait lost the race against
    // a cold start in production (8/9 on 2026-09-23 with results that did
    // arrive a moment later).
    const searchDone = page.waitForResponse(
      (r) => r.url().includes("/api/exercises/search") && new URL(r.url()).searchParams.get("q") === "press de banca",
      { timeout: 20000 }
    );
    await page.fill('input[placeholder^="Buscar"]', "press de banca");
    await searchDone.catch(() => {});
    const matches = page.locator(".grid button[type=button]", { hasText: /press de banca/i });
    await matches.first().waitFor({ timeout: 10000 }).catch(() => {});
    const cards = await matches.count();
    check("search in Spanish", cards > 0, `${cards} resultados`);
    await matches.first().click();
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
    const done = await page.locator("form[data-exercise] button.bg-sets").count();
    check("log a set", done >= 1);

    await page.click("text=Terminar entrenamiento");
    await page.waitForURL(/\/progreso/);
    check("finish session → progreso", (await page.textContent("body")).includes("Smoke Push"));

    // Gamificación (docs/gamificacion.md): la sesión da XP y Hoy enseña el rango.
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    check("rank on Hoy", /Bronce I{1,3}/.test(await page.textContent("body")));

    await page.goto(`${BASE}/perfil`, { waitUntil: "networkidle" });
    check("perfil loads", (await page.textContent("body")).includes(username));

    await page.goto(`${BASE}/retos`, { waitUntil: "networkidle" });
    // La cuenta del smoke no tiene coach: en lugar de ranking, la tarjeta.
    check("retos loads", (await page.textContent("body")).includes("Cuando entrenes con un coach"));

    await page.goto(routineUrl, { waitUntil: "networkidle" });
    await page.click("text=Eliminar rutina");
    await Promise.all([page.waitForURL(`${BASE}/rutinas`), page.click("text=Sí, eliminar")]);
    check("delete routine", page.url() === `${BASE}/rutinas`);
    await isolation(browser);
    await coachFlow(browser);
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
