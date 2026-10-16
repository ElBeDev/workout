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

/**
 * Espera a que la pantalla termine de llegar. Desde que hay `loading.tsx`, la
 * URL cambia al instante y primero se ve el esqueleto (`aria-busy`); leer la
 * página antes daría el esqueleto y no el contenido.
 */
async function ready(page) {
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 30000 });
}
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
    await ready(page);

    const status = async (path) => (await page.request.get(`${BASE}${path}`, { maxRedirects: 0 })).status();
    await page.goto(`${BASE}/coach`, { waitUntil: "networkidle" });
    const panel = await page.textContent("body");
    check("coach panel: only own members", panel.includes(clientA.username) && !panel.includes(clientB.username));
    const own = await (await page.request.get(`${BASE}/coach/usuarios/${clientA.id}`)).text();
    check("own member visible", own.includes(clientA.username) && !own.includes("NEXT_HTTP_ERROR_FALLBACK;404"));
    check("own hidden member's photo", (await status(`/api/avatar/${clientA.id}`)) === 200);
    // Las páginas van en streaming (loading.tsx), así que el código HTTP ya
    // salió como 200 cuando notFound() corre: se revisa el contenido. El
    // texto "could not be found" viene en todas las páginas; la marca de que
    // de verdad fue 404 es NEXT_HTTP_ERROR_FALLBACK;404. La foto es un route
    // handler y sí da 404 de verdad.
    const blockedPage = async (path) => {
      const html = await (await page.request.get(`${BASE}${path}`)).text();
      return html.includes("NEXT_HTTP_ERROR_FALLBACK;404") && !html.includes(clientB.username) && !html.includes("Smoke B");
    };
    const blocked = await Promise.all([
      blockedPage(`/coach/usuarios/${clientB.id}`),
      blockedPage(`/coach/usuarios/${clientB.id}/sesion/${sessionB.id}`),
      blockedPage(`/rutinas/${routineB.id}`),
      blockedPage(`/retos/socio/${clientB.id}`),
      status(`/api/avatar/${clientB.id}`).then((s) => s === 404),
    ]);
    check("other coach's member: not found everywhere", blocked.every(Boolean), blocked.join(","));
    await ctx.close();

    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx2.addCookies([{ name: "workout:idioma", value: "es", url: BASE }]);
    const page2 = await ctx2.newPage();
    await page2.goto(`${BASE}/login`);
    await page2.fill('input[name="username"]', clientA2.username);
    await page2.fill('input[name="password"]', password);
    await Promise.all([page2.waitForURL(`${BASE}/`), page2.click('button[type="submit"]')]);
    await ready(page2);
    await page2.goto(`${BASE}/retos`, { waitUntil: "networkidle" });
    const board = (await page2.textContent("body")).toLowerCase();
    check(
      "ranking: only own group",
      board.includes(clientA2.username) && !board.includes(clientB.username) && !board.includes(coachA.username)
    );
    const card = await (await page2.request.get(`${BASE}/retos/socio/${clientB.id}`)).text();
    const photo = (await page2.request.get(`${BASE}/api/avatar/${clientB.id}`, { maxRedirects: 0 })).status();
    const other = [card.includes("NEXT_HTTP_ERROR_FALLBACK;404") && !card.includes(clientB.username), photo === 404];
    check("other group's visible member: not found", other.every(Boolean), other.join(","));
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
    await ready(coach.page);
    const code = (await coach.page.textContent("body")).match(/GL-[0-9A-Z]{4}/)?.[0];
    check("coach signup → panel with code", Boolean(code), code ?? "");
    const coachId = await idOf(coachUser);

    // 2. Alumno nuevo por la liga
    const viaLink = await newPage();
    await viaLink.page.goto(`${BASE}/unirse/${code}`);
    await Promise.all([viaLink.page.waitForURL(`${BASE}/registro`), viaLink.page.click("text=Crear cuenta")]);
    await ready(viaLink.page);
    check("join link → signup shows coach", (await viaLink.page.textContent("body")).includes("Entrena con"));
    await viaLink.page.fill('input[name="username"]', linkUser);
    await viaLink.page.fill('input[name="password"]', password);
    await Promise.all([viaLink.page.waitForURL(`${BASE}/`), viaLink.page.click('button[type="submit"]')]);
    await ready(viaLink.page);
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
    await ready(asks.page);
    await asks.page.goto(`${BASE}/perfil`);
    await asks.page.fill("#coach-username", coachUser);
    await Promise.all([asks.page.waitForURL(/coach=enviada/), asks.page.click("text=Pedir unirme")]);
    await ready(asks.page);
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
    await ready(coach.page);
    const copias = await sql`select count(*)::int n from routines where created_by = ${coachId} and user_id in (${linkId}, ${reqId}) and name = 'Smoke Copia'`;
    check("copy routine to 2 members", copias[0].n === 2);
    await viaLink.page.goto(`${BASE}/rutinas`, { waitUntil: "networkidle" });
    check("member sees 'De tu coach'", (await viaLink.page.textContent("body")).includes("De tu coach"));

    // 5. Dejar al coach
    await asks.page.goto(`${BASE}/perfil`, { waitUntil: "networkidle" });
    await asks.page.click("text=Dejar a mi coach");
    await Promise.all([asks.page.waitForURL(/perfil/), asks.page.click("text=Sí, dejarlo")]);
    await ready(asks.page);
    await asks.page.waitForFunction(() => document.body.innerText.includes("Entrenas por tu cuenta"), null, { timeout: 15000 });
    check("member leaves coach → ended", (await link(coachId, reqId)) === "ended");

    for (const p of [coach, viaLink, asks]) await p.ctx.close();
  } finally {
    await sql`delete from users where username in (${coachUser}, ${linkUser}, ${reqUser})`;
    console.log("cleanup: deleted the 3 coach-flow accounts");
  }
}

/**
 * Paso 6 (docs/coaches.md §8): las páginas públicas abren sin sesión, una
 * cuenta normal no entra a /admin, y un dueño desechable ve a los coaches y
 * le da el plan gratis a uno. El dueño sólo ve coaches, nunca alumnos.
 */
async function ownerAndPublic(browser, normalPage) {
  const ctx = await browser.newContext();
  const anon = await ctx.newPage();
  for (const [path, text] of [["/coaches", "$199"], ["/terminos", "No es consejo médico"], ["/privacidad", "ARCO"]]) {
    const res = await anon.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    check(`public ${path}`, res.status() === 200 && (await anon.textContent("body")).includes(text));
  }
  await ctx.close();

  await normalPage.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  check("normal account can't open /admin", new URL(normalPage.url()).pathname === "/");

  const tag = Date.now().toString(36);
  const salt = randomBytes(16).toString("hex");
  const hash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
  const [owner] = await sql`insert into users (username, password_hash, is_admin, show_in_ranking) values (${`smoke_dueno_${tag}`}, ${hash}, true, false) returning id, username`;
  const [coach] = await sql`insert into users (username, password_hash, role, show_in_ranking) values (${`smoke_cdueno_${tag}`}, ${hash}, 'coach', false) returning id, username`;
  try {
    await sql`insert into coaches (user_id, code, plan, billing_status) values (${coach.id}, ${`SMK-D${tag}`}, 'coach', 'trialing')`;
    const octx = await browser.newContext();
    await octx.addCookies([{ name: "workout:idioma", value: "es", url: BASE }]);
    const page = await octx.newPage();
    await page.goto(`${BASE}/login`);
    await page.fill('input[name="username"]', owner.username);
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForURL(`${BASE}/`), page.click('button[type="submit"]')]);
    await ready(page);
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    check("owner panel lists coaches", (await page.textContent("body")).includes(coach.username));
    const row = page.locator("div", { hasText: coach.username }).locator("button", { hasText: "Dar plan gratis" }).last();
    await row.click();
    for (let i = 0; i < 30 && (await sql`select plan from coaches where user_id = ${coach.id}`)[0].plan !== "comp"; i++) {
      await new Promise((r) => setTimeout(r, 500));
    }
    check("owner gives free plan", (await sql`select plan from coaches where user_id = ${coach.id}`)[0].plan === "comp");
    await octx.close();
  } finally {
    await sql`delete from users where id in (${owner.id}, ${coach.id})`;
    console.log("cleanup: deleted the owner and its coach");
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
    await ready(page);
    check("login", page.url() === `${BASE}/`);

    await page.goto(`${BASE}/rutinas`, { waitUntil: "networkidle" });
    await page.click('button[aria-label="Nueva rutina"]');
    await page.waitForSelector('input[name="name"]');
    await page.fill('input[name="name"]', "Smoke Push");
    await Promise.all([page.waitForURL(/\/rutinas\/[0-9a-f-]{36}$/), page.click("text=Crear rutina")]);
    await ready(page);
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
    await ready(page);
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
    await ready(page);
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
    await ready(page);
    check("delete routine", page.url() === `${BASE}/rutinas`);
    await isolation(browser);
    await coachFlow(browser);
    await ownerAndPublic(browser, page);
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
