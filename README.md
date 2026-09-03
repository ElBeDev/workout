## Workout

App web mobile-first para llevar rutinas de ejercicio: armar rutinas, ver
video/gif de cómo se hace cada ejercicio, y registrar peso/reps por serie
durante el entrenamiento.

Ver [PLAN.md](./PLAN.md) para el plan completo (features, modelo de datos,
roadmap).

### Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Drizzle ORM + Neon (Postgres)
- Vercel (deploy) + Vercel Blob (storage, cuando se necesite)

### Desarrollo local

```bash
npm install
cp .env.example .env.local   # y llenar DATABASE_URL
npm run dev
```

### Base de datos

El schema vive en `src/db/schema.ts`. Para aplicarlo a la base de datos:

```bash
npm run db:push
```
