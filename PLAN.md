# Plan: App Web de Ejercicio (mobile-first) — estilo TrainWise

## 0. Estado actual (2026-09-03)

🟢 **Ya está en línea**: https://workout-eight-neon.vercel.app — repo en [github.com/ElBeDev/workout](https://github.com/ElBeDev/workout), deploy automático a Vercel en cada push a `main`.

Lo que ya funciona de punta a punta:

- [x] Proyecto Next.js + TypeScript + Tailwind, mobile-first, instalable como PWA.
- [x] Base de datos en Neon (Postgres) con el modelo completo (usuarios, ejercicios, rutinas, sesiones, sets).
- [x] Catálogo de **1,500 ejercicios con gif** cargado desde ExerciseDB.
- [x] Crear / listar / borrar rutinas.
- [x] Buscar y agregar ejercicios a una rutina (con gif, series/reps/peso objetivo).
- [x] Modo entrenamiento: loguear peso y reps por serie, con el dato de la sesión anterior como referencia.
- [x] Terminar sesión → aparece en Progreso (lista de sesiones completadas).

- [x] Login real (usuario + contraseña, sesión guardada en cookie).
- [x] Explorador visual de ejercicios (grid con gif, filtro por grupo muscular) al agregar a una rutina.
- [x] Gráficas de progreso por ejercicio (peso máximo por sesión, Recharts).
- [x] Fallback a un ícono cuando el gif de un ejercicio no carga.

- [x] Reordenar ejercicios dentro de una rutina (flechas subir/bajar).
- [x] Rest timer entre series (90s por defecto, +/-15s) integrado en el bloque de estado del entrenamiento.

- [x] Rediseño completo siguiendo la referencia de Dribbble (fondo lavanda, tarjetas blancas, botón principal negro en píldora, chips oscuros, nav flotante, tipografía Outfit). Modo oscuro incluido.
- [x] Renombrar y eliminar rutinas (con confirmación inline). Al eliminar, el historial de sesiones se conserva como "Rutina eliminada".
- [x] Editar series / reps / peso objetivo de un ejercicio ya agregado, sin quitarlo (tocar la línea "N series · N reps"). Default al agregar: 2 series.
- [x] Todas las acciones sobre rutinas verifican que la rutina sea del usuario logueado.

**MVP (fase 1) completo.**

Fase 2 (hecha en la segunda tanda del mismo día):

- [x] Sesión en curso: Home muestra "Entrenamiento en curso" con Continuar / Descartar; "Empezar" reanuda la sesión abierta en vez de duplicarla.
- [x] Feedback al guardar: spinner en el ✓ de cada serie, `error.tsx` con reintentar si falla la red.
- [x] "Agregar serie" sobre la marcha durante el entrenamiento; notas por sesión (se guardan al salir del campo).
- [x] Hoja "cómo se hace": tocar el gif (rutina, entrenamiento) o la "i" (explorador) abre gif grande + pasos. Los pasos vienen en inglés de ExerciseDB.
- [x] Nombres en español (`exercises.name_es`, traductor por reglas en `src/lib/translate-exercise.ts`); la búsqueda acepta español o inglés; el nombre en inglés se muestra debajo.
- [x] Detalle de sesión pasada (series kg × reps, duración, volumen, notas). Gráfica por ejercicio con peso máx / reps máx / volumen; ejercicios sin peso grafican reps.
- [x] Home: "Hoy toca" según días asignados a cada rutina, "Última vez" por rutina, sesiones de la semana y racha de semanas (zona horaria Ciudad de México).
- [x] Duplicar rutina. Cambiar contraseña. Peso corporal (registro + gráfica). Aviso de que no hay recuperación de contraseña.
- [x] Ícono real de la app. Offline básico: páginas visitadas abren sin señal; los cambios siguen necesitando conexión.
- [ ] Offline con cola de escrituras (guardar series sin señal y sincronizar después) — lo único grande que queda.
- [ ] Traducir las instrucciones paso a paso (hoy en inglés).

Notas de infra que ya no hay que repetir:
- El cliente de DB (`src/db/index.ts`) es "lazy" a propósito — si se inicializa en el import top-level, `next build` truena en Vercel al analizar rutas aunque `DATABASE_URL` sí exista en el entorno de runtime.
- En Vercel, la integración de Neon prefija sus variables como `DATABASE_URL_*` si ya existe una variable llamada `DATABASE_URL` — la que de verdad lee el código es la que se llama exactamente `DATABASE_URL` (sin prefijo).
- El primer registro en `/registro` reclamó el usuario placeholder que existía antes del login (así la rutina "Espalda" no se perdió). Ya pasó: la cuenta es `bener`. El código en `src/app/registro/actions.ts` sigue ahí pero ya no aplica a nadie; se puede borrar cuando se quiera.
- `npm run db:push` (drizzle-kit) pide confirmación interactiva cuando la tabla tiene datos y no funciona sin TTY (p. ej. desde un agente). Las últimas migraciones (`username`/`password_hash`/`sessions`, y `workout_sessions.routine_id` nullable con `ON DELETE SET NULL`) se aplicaron con SQL a mano contra Neon y luego se verificó que `db:push` no detectara diferencias. El `schema.ts` es la fuente de verdad.
- Ya hay más usuarios reales además de `bener` (se registraron dos personas más). Cualquier script contra la base debe filtrar por usuario; nunca borrar en masa.
- La segunda ronda de migraciones (`routines.days int[]`, `workout_sessions.notes`, `exercises.name_es`, tabla `body_weights`) también se aplicó con SQL a mano y luego `db:push` confirmó cero diferencias.
- `name_es` se regenera con `node --env-file=.env.local ./node_modules/.bin/tsx scripts/translate-exercises.ts` (idempotente); `scripts/preview-translations.ts` muestra una muestra antes de escribir.
- El service worker (`public/sw.js`) tiene un `VERSION`; si cambia la estrategia de cache hay que subir ese número para que los clientes descarten el cache viejo.
- "Hoy" y "esta semana" se calculan en `America/Mexico_City` (`src/lib/dates.ts`) porque Vercel corre en UTC.
- Para probar en local se usa una cuenta QA desechable creada directo en la base (`insert into users ...` con hash scrypt), se recorre la app con Playwright (`npx playwright` + Chromium) y al final se borra el usuario — el `ON DELETE CASCADE` se lleva rutinas y sesiones. Nunca se toca la cuenta real.

## 1. Visión

Web app optimizada para celular (PWA) para llevar el gym de forma digital:

- Ver y armar **rutinas** de ejercicio.
- Cada ejercicio con **video/gif de ejemplo** de cómo se hace.
- **Modo entrenamiento**: seguir la rutina en vivo, marcando series.
- Registrar **peso usado y repeticiones** por serie (con el peso de la vez anterior como referencia).
- Ver **progreso histórico** por ejercicio (gráficas de peso/reps en el tiempo).

## 2. Referencias investigadas

| App | Qué hace bien | Qué tomar de ejemplo |
|---|---|---|
| **TrainWise Fit / TrainWise App** | Programas estructurados, tutoriales de ejercicios (100+), check-ins, seguimiento de progreso | Estructura de "programas" con sesiones semanales |
| **Strong** | Interfaz rápida y sin distracciones para loggear series, rest timer | UX de logueo de series (referencia #1 a copiar) |
| **Fitbod** | Sugiere peso/reps automáticamente en base a lo que hiciste antes (progressive overload) | Auto-sugerencia de peso basada en el último registro |
| **Jefit** | 1400+ ejercicios con demo en video/gif | Catálogo de ejercicios con filtro por músculo/equipo |
| **Setgraph** | Enfocado 100% en trackear fuerza y progreso | Gráficas simples de progreso por ejercicio |

Conclusión: el patrón ganador es **"planner + tracker"**: armas la rutina una vez, y cada sesión solo entras a "ejecutarla" registrando peso/reps, con el dato anterior siempre visible como referencia para saber si subiste, bajaste o quedaste igual.

## 3. Features — MVP (fase 1)

1. **Auth simple** ✅ — usuario + contraseña (sin email/Google), multiusuario real vía `sessions` cookie.
2. **Catálogo de ejercicios** ✅
   - Nombre, músculo objetivo, equipo necesario, gif/video demo, instrucciones cortas.
   - Se puede alimentar de una API pública (ver sección 5) en lugar de armar el catálogo a mano.
3. **Rutinas (armar/editar)**
   - Crear rutina con nombre (ej. "Push Day", "Piernas"). ✅
   - Agregar ejercicios a la rutina, definir series objetivo, reps objetivo, y opcional peso objetivo. ✅
   - Reordenar / eliminar ejercicios. ✅
   - Editar series / reps / peso de un ejercicio ya agregado. ✅
   - Renombrar / eliminar la rutina (conservando historial). ✅
   - Puede haber varias rutinas y organizarlas por día de la semana o por "programa" (ej. rutina de 4 días). ✅ (varias rutinas sí; agrupar por "programa" queda para después)
4. **Modo entrenamiento (ejecutar rutina)** ✅
   - Entras a la rutina del día, ves el primer ejercicio con su gif.
   - Por cada serie: input rápido de **peso** y **reps**, botón "listo" para marcar la serie. ✅
   - Se muestra automáticamente lo que hiciste la última vez en ese mismo ejercicio/serie (referencia para progressive overload). ✅
   - Rest timer entre series (opcional pero muy usado). ✅
   - Al terminar, la rutina queda guardada como "sesión completada" con fecha. ✅
5. **Historial / progreso** ✅
   - Por ejercicio: gráfica simple de peso máximo o volumen a través del tiempo. ✅ (peso máximo; volumen queda para después)
   - Calendario/lista de sesiones completadas. ✅

## 4. Features — fase 2 (nice to have)

- Sugerencia automática de peso/reps para la próxima sesión (progressive overload asistido). ⏳
- ~~Notas por sesión~~ ✅
- ~~Body weight tracking~~ ✅ (fotos de progreso ⏳ — necesitaría Vercel Blob)
- Compartir rutina con un link. ⏳
- ~~Modo offline (PWA) para gimnasios sin señal~~ ✅ lectura; escritura sin señal ⏳
- Recordatorios / notificaciones ("hoy toca pierna"). ⏳ (ya existe "Hoy toca" dentro de la app; faltarían push notifications)

## 5. Videos/gifs de ejercicios — de dónde sacarlos

No hace falta grabar ni animar nada a mano, hay APIs/bases de datos gratis:

- **ExerciseDB** (https://github.com/exercisedb/exercisedb-api) — 11,000+ ejercicios, incluye gifs, target de músculo, equipo, instrucciones paso a paso. Versión gratis con ~1,500 ejercicios con gif, sin necesidad de API key.
- **WorkoutX** (https://workoutxapp.com/) — 1,400+ ejercicios con gif animado, filtrable por músculo/equipo, free tier 500 requests/mes.
- **wger** (open source, self-hosted) — base de datos abierta, buena si se quiere tener control total y correr el catálogo en nuestro propio servidor, pero sin gifs animados (solo imágenes estáticas en algunos casos).

**Recomendación**: arrancar con **ExerciseDB** para tener gifs desde el día 1 sin curar contenido manualmente; guardar en nuestra propia base de datos una copia/cache de los ejercicios que realmente se usen (evita depender de rate limits y permite agregar ejercicios custom del usuario después).

## 6. Modelo de datos (simplificado)

```
User
 └─ id, username, password_hash

Session (auth, no confundir con WorkoutSession)
 └─ token, user_id, expires_at

Exercise
 └─ id, nombre, músculo, equipo, gif_url/video_url, instrucciones

Routine
 └─ id, user_id, nombre, orden

RoutineExercise (ejercicio dentro de una rutina)
 └─ id, routine_id, exercise_id, orden, series_objetivo, reps_objetivo, peso_objetivo (opcional)

WorkoutSession (una ejecución real de la rutina)
 └─ id, user_id, routine_id (nullable, SET NULL al borrar la rutina), started_at, finished_at

SetLog (cada serie registrada durante la sesión)
 └─ id, session_id, exercise_id, numero_serie, peso, reps, completada
```

`SetLog` es la tabla clave: de ahí sale todo el historial y las gráficas de progreso.

## 7. Stack técnico (real, ya implementado)

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 — mobile-first, con `app/manifest.ts` para que sea instalable como app en el celular.
- **Diseño**: sistema propio inspirado en [este shot de Dribbble](https://dribbble.com/shots/26265316-Ai-Powered-Smarter-Home-Workout-App-Design). Tokens en `src/app/globals.css` (`--background` lavanda, `--surface`, `--primary` casi negro, `--accent` lavanda fuerte, `--danger`, con variante dark). Primitivas en `src/components/ui.tsx`: `Card`, `PrimaryButton`, `SecondaryButton`, `CircleButton`, `Chip`, `Input`, `PageHeader`, `BackButton`, `SectionTitle`. Fuente Outfit vía `next/font`. Iconos `lucide-react`.
- **Backend/DB**: Neon (Postgres serverless) + Drizzle ORM. Ajustamos el plan original de Supabase por Neon porque el deploy es en Vercel y Neon se integra nativo ahí (Storage tab del proyecto).
- **Auth**: usuario + contraseña propios (scrypt vía `node:crypto`, sin dependencias extra), sesión en cookie httpOnly respaldada por tabla `sessions` (`src/lib/session.ts`, `src/lib/password.ts`).
- **Gráficas de progreso**: Recharts — peso máximo por sesión, por ejercicio.
- **Gifs/videos de ejercicios**: ExerciseDB, cacheados en nuestra propia tabla `exercises` (script `scripts/seed-exercises.ts`).
- **Storage de archivos**: Vercel Blob — ya está la variable `BLOB_READ_WRITE_TOKEN` configurada en Vercel, sin usar todavía (se necesitará cuando haya fotos de progreso o ejercicios custom del usuario).
- **Deploy**: Vercel, deploy automático en cada push a `main`.

## 8. Pantallas principales

1. **Login / Registro** — usuario + contraseña. ✅
2. **Home** — saludo con el usuario, tarjetas de rutina (gif del primer ejercicio, nº de ejercicios y series) con botón ▶ para empezar. ✅
3. **Mis rutinas** — lista de rutinas + crear. ✅
4. **Detalle de rutina** — bloque lavanda con stats (ejercicios / series / músculos), CTA "Empezar entrenamiento", lista de ejercicios (editar series/reps/peso inline, subir/bajar, quitar), explorador para agregar (grid con gif, filtro por músculo), y "Ajustes de la rutina" (renombrar / eliminar). ✅
5. **Modo entrenamiento** — bloque lavanda pegajoso (`SessionHud`) con tiempo transcurrido, barra de series completadas y el descanso en grande cuando se marca una serie (−15s / Saltar / +15s); tarjetas por ejercicio con una fila por serie (kg + reps, placeholder con lo de la sesión anterior, ✓ para marcar). ✅
6. **Progreso** — sesiones completadas (las de rutinas borradas salen como "Rutina eliminada") + por ejercicio: mejor marca, última sesión, gráfica de área de peso máximo por sesión. ✅
7. **Perfil** — usuario logueado, cerrar sesión. ✅ (peso corporal queda para fase 2)

## 9. Roadmap

- ~~Semana 1: setup del proyecto (Next.js + DB + PWA), modelo de datos~~ ✅
- ~~Semana 2: catálogo de ejercicios (ExerciseDB) + CRUD de rutinas~~ ✅
- ~~Semana 3: modo entrenamiento (logueo de series) + guardado de sesiones~~ ✅
- ~~Gráficas de progreso, explorador visual de ejercicios, auth real (usuario + contraseña)~~ ✅
- ~~Reordenar ejercicios en una rutina, rest timer~~ ✅

- ~~Fase 2: sesión en curso, feedback al guardar, series extra, notas, instrucciones, nombres en español, detalle de sesión, gráfica peso/reps/volumen, "Hoy toca", racha, duplicar, contraseña, peso corporal, ícono, offline de lectura~~ ✅

**Queda (sin prisa):** cola offline para guardar series sin señal, sugerencia automática de peso/reps, compartir rutina por link, push notifications, fotos de progreso (Vercel Blob), traducir instrucciones.

## 10. Mapa del código

```
src/app/
  layout.tsx            Fuente Outfit, viewport/theme-color, Connectivity, BottomNav
  globals.css           Tokens de diseño (light/dark) y @theme de Tailwind
  manifest.ts, icon.png PWA manifest + favicon
  error.tsx             Error global con "Reintentar"
  offline/              Fallback del service worker para páginas no visitadas
  page.tsx              Home: sesión en curso, stats semanales, "Hoy toca", rutinas
  login/, registro/     Auth (page + actions)
  rutinas/page.tsx      Lista + crear (actions.ts: createRoutine)
  rutinas/[id]/         Detalle: page, actions (add/remove/move/update ejercicio,
                        rename/delete/duplicate rutina, setRoutineDays — todas con
                        requireOwnedRoutine), AddExerciseForm, ExerciseTargetsEditor,
                        RoutineSettings (nombre, días, duplicar, eliminar)
  entrenar/actions.ts   startSession (reanuda si hay abierta), discardSession
  entrenar/[sessionId]/ page, actions (logSet upsert, addExtraSet, saveNotes,
                        finishSession — con requireOwnedSession), SessionNotes, error.tsx
  progreso/             Lista de sesiones y ejercicios; [exerciseId] = gráfica;
                        sesion/[id] = detalle de una sesión
  perfil/               Usuario, peso corporal, cambiar contraseña, logout (actions.ts)
  api/exercises/search  Búsqueda/browse del catálogo (q en es/en, bodyPart, offset); requiere sesión
src/components/
  ui.tsx                Primitivas del sistema de diseño
  BottomNav.tsx         Nav flotante (oculto en /login y /registro)
  Connectivity.tsx      Registra sw.js, calienta el cache de la ruta actual, banner offline
  ExercisePicker.tsx    Grid de ejercicios con chips por músculo, "i" de info y "Cargar más"
  ExerciseInfoSheet.tsx Bottom sheet con gif grande + pasos
  ExerciseThumb.tsx     <img> con fallback a ícono si el gif falla
  SessionHud.tsx        Bloque lavanda del entrenamiento (transcurrido + descanso)
  LogSetButton.tsx      ✓ de cada serie con spinner (useFormStatus); dispara "workout:rest-start"
  PendingButton.tsx     Botón de submit con spinner genérico
  DiscardSessionButton.tsx  Descartar sesión con confirmación inline
  ExerciseProgressChart.tsx AreaChart con toggle peso/reps/volumen
  BodyWeightChart.tsx   AreaChart del peso corporal
src/db/
  schema.ts             Fuente de verdad del modelo (Drizzle)
  index.ts              Cliente Neon lazy
  queries.ts            getRoutineSummaries, getOpenSession, getWeeklyStats
src/lib/
  session.ts            createSession / destroySession / getCurrentUserId / requireUserId
  password.ts           scrypt hash + verify
  body-parts.ts         Etiquetas en español de los grupos musculares
  dates.ts              Zona horaria MX, día de la semana, clave de semana, "hace N días"
  translate-exercise.ts Traductor por reglas de nombres de ejercicio
public/sw.js            Service worker (app shell + páginas visitadas + gifs)
scripts/
  seed-exercises.ts     Carga el catálogo desde ExerciseDB (con backoff por rate limit)
  translate-exercises.ts / preview-translations.ts   name_es
```

## 11. Registro de cambios (2026-09-03)

Todo el trabajo fue en un solo día; el historial fino está en `git log`. Resumen por commit:

| Commit | Qué |
|---|---|
| `df991ae` | Scaffold Next.js, shell mobile con nav, schema Drizzle, manifest PWA |
| `5a8bd4c` | Seed de 1,500 ejercicios, CRUD de rutinas, buscador, modo entrenamiento, progreso |
| `a9f2739` | Cliente de DB lazy (fix del build en Vercel) |
| `0a1ee79` | Gráficas de progreso por ejercicio |
| `a627a10` | Explorador visual de ejercicios + primer pase de diseño |
| `57e077b` | Cuentas reales (usuario + contraseña) y fallback de gifs rotos |
| `f2f0fa6` | Reordenar ejercicios + rest timer — MVP cerrado |
| `c84a1c5` | Rediseño completo con el sistema lavanda / píldora (Outfit, `ui.tsx`, `SessionHud`) |
| `6d96b3c` | Renombrar / eliminar rutinas conservando historial; ownership en acciones |
| `9eb4e8c` | Fix botón de confirmar eliminación invisible en dark mode |
| `7651ede` | Editor inline de series/reps/peso; default 2 series |
| `7224b05` | Ocultar spinners numéricos en el editor inline |
| `7ddfc32` | Sesión en curso (continuar/descartar), spinner al guardar, series extra, notas, migraciones de fase 2 |
| `1280c01` | Nombres en español + hoja "cómo se hace" |
| `363c650` | Detalle de sesión, gráfica peso/reps/volumen, "Hoy toca", racha semanal, duplicar rutina |
| `dbee217` | Cambiar contraseña, peso corporal, ícono real, offline básico |

---

**Fuentes consultadas:**
- [TrainWise Fit App - App Store](https://apps.apple.com/us/app/trainwise-fit/id6448630653)
- [TrainWise App](https://www.trainwiseapp.com/)
- [Best Workout Tracker Apps For 2026 – Fitbod](https://fitbod.me/blog/best-workout-tracker-apps-for-2026/)
- [Best Workout Apps 2026 - JEFIT](https://www.jefit.com/blog/best-workout-apps-for-2026-top-7-options-tested-and-reviewed)
- [Setgraph: Best Progressive Overload App & Tracker (2026)](https://setgraph.app/articles/setgraph-the-best-workout-tracker-app-for-strength-training-and-progressive-overload)
- [ExerciseDB API (GitHub)](https://github.com/exercisedb/exercisedb-api)
- [WorkoutX - Exercise Database API with GIFs](https://workoutxapp.com/)
- [Build a full-stack app with Next.js and Supabase - LogRocket](https://blog.logrocket.com/build-full-stack-app-next-js-supabase/)
