## Workout

App web mobile-first (PWA) para llevar rutinas de gym: armar rutinas con
ejercicios del catálogo (1,500 con gif, nombres en español) o propios,
entrenar registrando kg/reps por serie con sugerencia de peso y cronómetro
de descanso (funciona sin señal), y ver el progreso por ejercicio, por
sesión y por semana. Multiusuario con cuentas propias.

En línea: https://workout-eight-neon.vercel.app (deploy automático en cada
push a `main`).

Ver [PLAN.md](./PLAN.md) para el plan completo, estado actual, mapa del
código, notas de infra y registro de cambios.

### Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + `lucide-react`
- Drizzle ORM + Neon (Postgres serverless)
- Auth propia: usuario + contraseña (scrypt), sesión en cookie httpOnly, bloqueo tras 8 fallos
- Recharts para las gráficas
- Vercel (deploy) + Vercel Blob (copia de gifs en uso y fotos de ejercicios propios)
- Service worker propio + cola offline de series en `localStorage`
- Playwright para la suite de humo (`tests/smoke.mjs`)

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

```bash
npm run smoke                                   # suite de humo contra localhost:3000 (crea y borra su propia cuenta)
BASE_URL=https://workout-eight-neon.vercel.app npm run smoke
node --env-file=.env.local ./node_modules/.bin/tsx scripts/mirror-gifs.ts   # copia gifs en uso a Vercel Blob (necesita BLOB_READ_WRITE_TOKEN)
```

Offline: `public/sw.js` cachea el shell y las páginas visitadas; las series
marcadas sin señal se encolan en `localStorage` y se sincronizan al
reconectar. Si cambias la estrategia del SW, sube `VERSION` dentro del archivo.

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
