## Workout

App web mobile-first para llevar rutinas de gym: armar rutinas con
ejercicios del catálogo (1,500 con gif), entrenar registrando kg/reps por
serie con rest timer, y ver el progreso por ejercicio.

En línea: https://workout-eight-neon.vercel.app (deploy automático en cada
push a `main`).

Ver [PLAN.md](./PLAN.md) para el plan completo, estado actual, mapa del
código, notas de infra y registro de cambios.

### Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + `lucide-react`
- Drizzle ORM + Neon (Postgres serverless)
- Auth propia: usuario + contraseña (scrypt), sesión en cookie httpOnly
- Recharts para las gráficas
- Vercel (deploy). Vercel Blob está configurado pero sin usar todavía.

### Desarrollo local

```bash
npm install
cp .env.example .env.local   # llenar DATABASE_URL (la de Neon, pooled)
npm run dev
```

Scripts útiles:

```bash
npm run lint
npm run build
npm run db:push            # aplica src/db/schema.ts a la base (pide TTY si hay datos)
npm run db:studio          # UI de Drizzle para ver la base
node --env-file=.env.local ./node_modules/.bin/tsx scripts/seed-exercises.ts        # recargar catálogo
node --env-file=.env.local ./node_modules/.bin/tsx scripts/preview-translations.ts  # muestra de nombres en español
node --env-file=.env.local ./node_modules/.bin/tsx scripts/translate-exercises.ts   # regenerar name_es
```

Offline: `public/sw.js` cachea el shell y las páginas visitadas. Si cambias
la estrategia, sube `VERSION` dentro del archivo.

### Base de datos

`src/db/schema.ts` es la fuente de verdad. Cuando `db:push` pide
confirmación interactiva (tablas con datos) y no hay terminal, aplicar el
cambio con SQL directo y luego volver a correr `db:push` para confirmar que
no queda diferencia. Ver las notas de infra en `PLAN.md` para los casos que
ya pasaron.

### Probar sin tocar la cuenta real

Crear un usuario QA directo en la base, recorrer la app (a mano o con
Playwright) y al final `delete from users where username = '...'` — el
cascade se lleva rutinas, sesiones y sets de esa cuenta.
