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
- [x] Offline con cola de escrituras (ver sección 12).
- [ ] Traducir las instrucciones paso a paso (hoy en inglés).

Tercera ronda (sección 12, misma fecha): sugerencia de peso, corregir series pasadas, ejercicios propios, gifs en Blob, cola offline, descanso configurable, heatmap, CSV, bloqueo de login, suite de humo. Todo hecho.

Cuarta ronda (sección 13, misma fecha): auditoría completa del código y arreglo de todos los hallazgos altos y medios (fechas en hora MX, sesiones huérfanas / terminadas / doble tap, consulta única del entrenamiento + índices, SW sin HTML redirigido y purga al cerrar sesión, cola offline validada y por usuario, ownership en ejercicios propios). Lo que sigue abierto está en la sección 9.

Quinta (2026-09-06): **placas como unidad de carga** — cada ejercicio de una rutina puede ser "Kilos" o "Placas" (máquinas de placas sin kg marcados). En el entrenamiento la casilla pide lo que corresponda, la sugerencia sube +1 placa, el detalle de sesión muestra "N placas × reps" (editable), la gráfica tiene "Placas máx." y el CSV una columna `placas`.

Notas de infra que ya no hay que repetir:
- El cliente de DB (`src/db/index.ts`) es "lazy" a propósito — si se inicializa en el import top-level, `next build` truena en Vercel al analizar rutas aunque `DATABASE_URL` sí exista en el entorno de runtime.
- En Vercel, la integración de Neon prefija sus variables como `DATABASE_URL_*` si ya existe una variable llamada `DATABASE_URL` — la que de verdad lee el código es la que se llama exactamente `DATABASE_URL` (sin prefijo).
- El primer registro en `/registro` reclamó el usuario placeholder que existía antes del login (así la rutina "Espalda" no se perdió). Ya pasó: la cuenta es `bener`, y ese código ya se eliminó de `src/app/registro/actions.ts`.
- `npm run db:push` (drizzle-kit) pide confirmación interactiva cuando la tabla tiene datos y no funciona sin TTY (p. ej. desde un agente). Las últimas migraciones (`username`/`password_hash`/`sessions`, y `workout_sessions.routine_id` nullable con `ON DELETE SET NULL`) se aplicaron con SQL a mano contra Neon y luego se verificó que `db:push` no detectara diferencias. El `schema.ts` es la fuente de verdad.
- Ya hay más usuarios reales además de `bener` (se registraron dos personas más). Cualquier script contra la base debe filtrar por usuario; nunca borrar en masa.
- La segunda ronda de migraciones (`routines.days int[]`, `workout_sessions.notes`, `exercises.name_es`, tabla `body_weights`) también se aplicó con SQL a mano y luego `db:push` confirmó cero diferencias.
- `name_es` se regenera con `node --env-file=.env.local ./node_modules/.bin/tsx scripts/translate-exercises.ts` (idempotente); `scripts/preview-translations.ts` muestra una muestra antes de escribir.
- El service worker (`public/sw.js`) tiene un `VERSION`; si cambia la estrategia de cache hay que subir ese número para que los clientes descarten el cache viejo.
- "Hoy" y "esta semana" se calculan en `America/Mexico_City` (`src/lib/dates.ts`) porque Vercel corre en UTC.
- Quinta migración a mano: `set_logs.plates integer` y `routine_exercises.load_unit text default 'kg'`.
- Tercera ronda de migraciones a mano (mismo método): `exercises.gif_blob_url / user_id / is_custom`, `users.rest_seconds / failed_logins / locked_until`, `routine_exercises.rest_seconds`.
- Cuarta ronda de migraciones a mano: índices (`set_logs(exercise_id)`, `workout_sessions(user_id, finished_at)`, `sessions(expires_at)`, `exercises(user_id)`, `routine_exercises(routine_id)`) y el índice único parcial `workout_sessions(user_id, routine_id) WHERE finished_at IS NULL` (una sola sesión abierta por rutina). Todos declarados también en `schema.ts`.
- Al cerrar sesión, `LogoutButton` borra los caches `pages-*` y las colas `workout:*` de `localStorage`, y avisa al SW (`purge-pages`). El SW (v3) no cachea respuestas redirigidas ni `/login`.
- Vercel Blob: `BLOB_READ_WRITE_TOKEN` es un secreto de solo escritura en Vercel (no se puede revelar ni bajar con `vercel env pull`), así que el barrido de gifs se hace desde la app: Perfil → "Imágenes de ejercicios" → botón que copia en tandas de 6 los gifs de los ejercicios que usas. Cada gif nuevo se copia solo al agregarlo a una rutina. `scripts/mirror-gifs.ts` sigue ahí por si algún día se tiene el token local.
- Eventos del cronómetro: `workout:rest-start` se dispara desde el `onClick` del botón, no desde la acción del formulario (dentro de la acción React agrupa el setState del HUD en la transición y el refresh lo pierde).
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
   - Por cada serie: input rápido de **peso** (kg o nº de placas, según el ejercicio) y **reps**, botón "listo" para marcar la serie. ✅
   - Se muestra automáticamente lo que hiciste la última vez en ese mismo ejercicio/serie (referencia para progressive overload). ✅
   - Rest timer entre series (opcional pero muy usado). ✅
   - Al terminar, la rutina queda guardada como "sesión completada" con fecha. ✅
5. **Historial / progreso** ✅
   - Por ejercicio: gráfica de peso máximo / reps máximas / volumen a través del tiempo. ✅
   - Calendario/lista de sesiones completadas. ✅

## 4. Features — fase 2 (nice to have)

- ~~Sugerencia automática de peso/reps para la próxima sesión~~ ✅ (`src/lib/suggest.ts`, píldora "Sube a / Repite" con botón Usar)
- ~~Notas por sesión~~ ✅
- ~~Body weight tracking~~ ✅ (fotos de progreso ⏳ — Vercel Blob ya está listo para ello)
- Compartir rutina con un link. ⏳
- ~~Modo offline (PWA) para gimnasios sin señal~~ ✅ lectura y escritura (cola de series sincronizada al reconectar)
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
 └─ id, username, password_hash, rest_seconds (descanso por defecto),
    failed_logins, locked_until, created_at

Session (auth, no confundir con WorkoutSession)
 └─ token, user_id, expires_at

Exercise (catálogo + propios)
 └─ id, name (en), name_es, body_part, equipment, gif_url (ExerciseDB),
    gif_blob_url (copia en Vercel Blob; la app prefiere esta), instructions,
    external_id, user_id (null = catálogo), is_custom

Routine
 └─ id, user_id, name, sort_order, days int[] (0=dom … 6=sáb)

RoutineExercise (ejercicio dentro de una rutina)
 └─ id, routine_id, exercise_id, sort_order, target_sets, target_reps,
    target_weight (opcional), rest_seconds (opcional, override del usuario)

WorkoutSession (una ejecución real de la rutina)
 └─ id, user_id, routine_id (nullable, SET NULL al borrar la rutina),
    started_at, finished_at (null = en curso), notes

SetLog (cada serie registrada durante la sesión)
 └─ id, session_id, exercise_id, set_number, weight, reps, completed, logged_at
    único por (session_id, exercise_id, set_number)

BodyWeight
 └─ id, user_id, weight, logged_at
```

Borrados: `users` → cascada a todo lo suyo (rutinas, sesiones, sets, pesos, ejercicios propios, sesiones de login). `routines` → cascada a `routine_exercises`; las `workout_sessions` se quedan con `routine_id = null`.

`SetLog` es la tabla clave: de ahí sale todo el historial y las gráficas de progreso.

## 7. Stack técnico (real, ya implementado)

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 — mobile-first, con `app/manifest.ts` para que sea instalable como app en el celular.
- **Diseño**: sistema propio inspirado en [este shot de Dribbble](https://dribbble.com/shots/26265316-Ai-Powered-Smarter-Home-Workout-App-Design). Tokens en `src/app/globals.css` (`--background` lavanda, `--surface`, `--primary` casi negro, `--accent` lavanda fuerte, `--danger`, con variante dark). Primitivas en `src/components/ui.tsx`: `Card`, `PrimaryButton`, `SecondaryButton`, `CircleButton`, `Chip`, `Input`, `PageHeader`, `BackButton`, `SectionTitle`. Fuente Outfit vía `next/font`. Iconos `lucide-react`.
- **Backend/DB**: Neon (Postgres serverless) + Drizzle ORM. Ajustamos el plan original de Supabase por Neon porque el deploy es en Vercel y Neon se integra nativo ahí (Storage tab del proyecto).
- **Auth**: usuario + contraseña propios (scrypt vía `node:crypto`, sin dependencias extra), sesión en cookie httpOnly respaldada por tabla `sessions` (`src/lib/session.ts`, `src/lib/password.ts`).
- **Gráficas**: Recharts — por ejercicio (peso máx / reps máx / volumen por sesión) y peso corporal; heatmap propio en SVG/CSS.
- **Catálogo de ejercicios**: ExerciseDB (1,500 con gif) copiado a nuestra tabla `exercises` (`scripts/seed-exercises.ts`), con nombre en español generado por reglas (`scripts/translate-exercises.ts`) y ejercicios propios por usuario.
- **Storage de archivos**: Vercel Blob — copia de los gifs en uso (`gif_blob_url`, se llena al agregar un ejercicio a una rutina) y fotos de ejercicios propios. En producción el token ya está; en local es opcional (todo es no-op sin él).
- **Offline**: service worker propio (`public/sw.js`) + cola de series en `localStorage`.
- **Pruebas**: Playwright (`tests/smoke.mjs`, `npm run smoke`) con cuenta desechable.
- **Deploy**: Vercel, deploy automático en cada push a `main`.

## 8. Pantallas principales

1. **Login / Registro** — usuario + contraseña; bloqueo tras 8 fallos; aviso de que no hay recuperación. ✅
2. **Home** — saludo, tarjeta de "Entrenamiento en curso" (continuar / descartar), stats de la semana y racha, "Hoy toca" según días asignados, rutinas con gif del primer ejercicio, nº de ejercicios/series y "última vez", botón ▶. ✅
3. **Mis rutinas** — lista + crear. ✅
4. **Detalle de rutina** — stats (ejercicios / series / músculos), CTA, lista de ejercicios (tocar gif = cómo se hace; editar series/reps/peso/descanso inline; subir/bajar; quitar), explorador (grid con gif, chips por músculo, búsqueda es/en, "i" de info, crear ejercicio propio), y ajustes (nombre, días de la semana, duplicar, eliminar). ✅
5. **Modo entrenamiento** — casilla de carga en kg o placas según el ejercicio; HUD lavanda pegajoso (transcurrido, barra de series, descanso en grande con −15s / Saltar / +15s), aviso de series en cola sin señal, por ejercicio: sugerencia de peso con "Usar", filas por serie (kg + reps, placeholder de la vez pasada, ✓ con spinner / ámbar si quedó en cola), "Agregar serie", notas de la sesión, terminar / descartar. ✅
6. **Progreso** — heatmap de 16 semanas, por ejercicio (mejor marca, última sesión, gráfica peso/reps/volumen, lista de sesiones), sesiones completadas → detalle con series editables, duración, volumen y notas. ✅
7. **Perfil** — usuario, peso corporal (registro + gráfica), descanso por defecto, cambiar contraseña, exportar CSV, cerrar sesión. ✅
8. **Cómo se hace** (bottom sheet) — gif grande, músculo, equipo, pasos (en inglés). ✅
9. **Offline** — banner sin conexión, páginas visitadas abren desde cache, `/offline` para las no visitadas. ✅

## 9. Roadmap

- ~~Semana 1: setup del proyecto (Next.js + DB + PWA), modelo de datos~~ ✅
- ~~Semana 2: catálogo de ejercicios (ExerciseDB) + CRUD de rutinas~~ ✅
- ~~Semana 3: modo entrenamiento (logueo de series) + guardado de sesiones~~ ✅
- ~~Gráficas de progreso, explorador visual de ejercicios, auth real (usuario + contraseña)~~ ✅
- ~~Reordenar ejercicios en una rutina, rest timer~~ ✅

- ~~Fase 2: sesión en curso, feedback al guardar, series extra, notas, instrucciones, nombres en español, detalle de sesión, gráfica peso/reps/volumen, "Hoy toca", racha, duplicar, contraseña, peso corporal, ícono, offline de lectura~~ ✅
- ~~Tercera ronda (sección 12): sugerencia de peso, corregir series pasadas, ejercicios propios, gifs en Blob, cola offline, descanso configurable, heatmap, CSV, bloqueo de login, suite de humo~~ ✅
- ~~Cuarta ronda (sección 13): auditoría y arreglo de los hallazgos altos y medios~~ ✅

**Queda abierto (sin prisa), en este orden sugerido:**
1. Pulsar "Copiar gifs" en Perfil (producción) una vez por usuario; después es automático.
2. Migraciones versionadas (`drizzle-kit generate` + carpeta `drizzle/`) para que el repo pruebe que producción coincide con `schema.ts`.
3. Throttle de login por IP (hoy el bloqueo es por cuenta).
4. Accesibilidad de la hoja "cómo se hace" (focus trap, `aria-labelledby`) y consolidar helpers duplicados (`requireOwnedSession`, `fieldClass`, `REST_SECONDS`).
5. Producto: récords personales con aviso, plantillas de rutina (Push/Pull/Legs), compartir rutina por link, push notifications, fotos de progreso, traducir las instrucciones paso a paso.

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
  entrenar/[sessionId]/ page, actions (logSet upsert, syncSets, addExtraSet, saveNotes,
                        finishSession — con requireOwnedSession), SetRow (guardado online /
                        cola offline), PendingSync, SessionNotes, error.tsx
  progreso/             Lista de sesiones, heatmap y ejercicios; [exerciseId] = gráfica;
                        sesion/[id] = detalle (SetRowEditor para corregir/borrar series)
  perfil/               Usuario, descanso por defecto, peso corporal, contraseña, copiar gifs a Blob, CSV, logout
  ejercicios/actions.ts createCustomExercise
  api/exercises/search  Búsqueda/browse (q en es/en, bodyPart, offset); catálogo + propios del usuario
  api/export            CSV del historial del usuario
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
  TrainingHeatmap.tsx   Días entrenados (16 semanas)
  SuggestionPill.tsx    "Sube a X kg" / "Repite" con botón Usar
  CustomExerciseForm.tsx  Alta de ejercicio propio dentro del explorador
src/db/
  schema.ts             Fuente de verdad del modelo (Drizzle)
  index.ts              Cliente Neon lazy
  exercise-gif.ts       coalesce(gif_blob_url, gif_url)
  queries.ts            getRoutineSummaries, getOpenSession, getWeeklyStats
src/lib/
  session.ts            createSession (purga expiradas) / destroySession / getCurrentUserId / requireUserId
  password.ts           scrypt hash + verify
  body-parts.ts         Etiquetas en español de los grupos musculares
  dates.ts              Zona horaria MX, día de la semana, clave de semana, "hace N días"
  translate-exercise.ts Traductor por reglas de nombres de ejercicio
  suggest.ts            Regla de progresión (+2.5 kg / +1 rep / repetir)
  offline-queue.ts      Cola de series en localStorage
  blob.ts               mirrorExerciseGif, pendingGifIds, uploadExercisePhoto (no-op sin token)
public/sw.js            Service worker (app shell + páginas visitadas + gifs; VERSION v2)
scripts/
  seed-exercises.ts     Carga el catálogo desde ExerciseDB (con backoff por rate limit)
  translate-exercises.ts / preview-translations.ts   name_es
  mirror-gifs.ts        Copia gifs a Vercel Blob (necesita BLOB_READ_WRITE_TOKEN)
tests/smoke.mjs         Suite de humo (`npm run smoke`)
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
| `3e548ab` | Sugerencia de peso en el entrenamiento; editar/borrar series de sesiones pasadas |
| `3d4fae0` | Ejercicios propios; gifs espejados a Vercel Blob (`coalesce(gif_blob_url, gif_url)`) |
| `377199c` | Cola offline para series (localStorage + `syncSets`) |
| `6b1fc9f` | Descanso configurable, heatmap, exportar CSV, bloqueo de login, `npm run smoke` |
| `f46d61e` | PLAN: modelo de datos y pantallas al día, sección 13 con la auditoría |
| `9ccbedf` | Foto de ejercicio propio alineada al tope de 4.5 MB de Vercel (`bodySizeLimit`) |
| `13effb8` | Botón en Perfil para copiar los gifs a Blob desde producción (el token es secreto de solo escritura) |
| `853fbc2` | Arreglo de la auditoría: fechas en hora MX, sesiones huérfanas/terminadas/doble tap, consulta única del entrenamiento + índices, SW v3 sin HTML redirigido y purga al cerrar sesión, cola offline validada y por usuario, ownership en ejercicios propios, varios bajos |

## 12. Siguiente ronda (acordada 2026-09-03)

Por orden de prioridad; se va tachando conforme se sube.

**Uso diario**
1. [x] Corregir / borrar series de una sesión pasada desde el detalle de sesión.
2. [x] Sugerencia de peso: si la sesión anterior cumplió todas las series con las reps objetivo, proponer +2.5 kg (o +1 rep en ejercicios sin peso); si no, proponer repetir. Botón "Usar" que rellena las series. (`src/lib/suggest.ts`)
3. [x] Ejercicios propios (nombre, músculo, equipo, notas, foto opcional en Vercel Blob). Solo los ve su dueño; salen primero en el explorador con la etiqueta "Propio".
4. [x] Gifs a Vercel Blob: `exercises.gif_blob_url`; se copia solo al agregar un ejercicio a una rutina (`mirrorExerciseGif`, no-op sin token) y `scripts/mirror-gifs.ts` copia en bloque los que ya están en uso (`--all` para todo el catálogo). La app siempre prefiere la copia propia. Pendiente: correr el script una vez con `BLOB_READ_WRITE_TOKEN` en `.env.local`.
5. [x] Cola offline: cada serie se intenta guardar; sin señal (o si el servidor falla) se encola en `localStorage` (`src/lib/offline-queue.ts`), la fila se marca en ámbar, y `PendingSync` la reenvía al reconectar (evento `online` + reintento cada 15 s) con `syncSets`. Sobrevive a recargar la página.

**Chicas**
6. [x] Descanso configurable: por defecto en Perfil (`users.rest_seconds`) y por ejercicio en el editor inline de la rutina (`routine_exercises.rest_seconds`). El ✓ de cada serie manda los segundos al HUD.
7. [x] Heatmap de 16 semanas en Progreso (`TrainingHeatmap`, zona horaria MX).
8. [x] Exportar CSV desde Perfil (`/api/export`: fecha, rutina, ejercicio es/en, serie, kg, reps, notas).
9. [x] Sesiones expiradas se borran al crear una nueva; 8 contraseñas fallidas bloquean la cuenta 15 min (`users.failed_logins`, `locked_until`).
10. [x] `npm run smoke` (`tests/smoke.mjs`): crea una cuenta desechable en la base, recorre login → rutina → ejercicio → entrenar → terminar → borrar, y elimina la cuenta. `BASE_URL=https://… npm run smoke` para probar producción.

**Todo lo acordado en esta ronda está hecho.**

## 13. Revisión de código (2026-09-03) — hallazgos pendientes

Auditoría completa de `src/`, `public/sw.js`, `scripts/` y `tests/` con lint y `tsc` limpios. Los cuatro altos, los medios de sesiones / cola offline / SW y varios bajos se arreglaron el mismo día (ver registro de cambios); lo que sigue con `[ ]` queda abierto.

**Altos (afectan al usuario hoy)**
- [x] **Fechas en UTC.** Todos los `Intl.DateTimeFormat("es-MX", …)` de Progreso, detalle de sesión, gráfica y Perfil no pasan `timeZone`, así que en Vercel una sesión de las 9 pm sale como el día siguiente a las 03:00. El heatmap y "Hoy toca" sí usan `APP_TIME_ZONE`, por lo que el mismo entrenamiento aparece en dos días distintos. Fix: helper `fmtDate()` en `src/lib/dates.ts` y usarlo en todos lados.
- [x] **Borrar una rutina con sesión abierta la deja atrapada.** `routine_id` pasa a null, el entrenamiento hace `notFound()`, no se puede terminar y la única salida (descartar) borra las series del día. Fix: renderizar la sesión desde sus `set_logs` o auto-terminarla; o impedir borrar la rutina mientras tenga sesión abierta.
- [x] **Service worker cachea HTML autenticado sin purgar al cerrar sesión**, y cachea la redirección a `/login` bajo la URL protegida. En un teléfono compartido, el usuario anterior queda visible offline. Fix: no guardar respuestas `redirected`, y borrar el cache `pages-*` al hacer logout.
- [x] **El entrenamiento hace una consulta por ejercicio, sin `LIMIT`, y se re-ejecuta en cada ✓** (`getLastTimeSets` en bucle + `revalidatePath` en `logSet`). Fix: una sola consulta con `DISTINCT ON`, quitar el `revalidatePath` de `logSet` (SetRow ya refleja el estado) y añadir índices.

**Medios**
- [x] Dos nombres de cache distintos: `Connectivity` calienta `pages-v1`, el SW usa `pages-v2`. Unificar la constante.
- [x] Cola offline: entradas de sesiones descartadas nunca se purgan (reintento cada 15 s para siempre); una entrada malformada aborta toda la sincronización; la cola no está separada por usuario; cualquier error del servidor se trata como "sin señal". Fix: `syncSets` devuelve `{saved, rejected}`, validar con zod por entrada, clave por usuario, distinguir error de red.
- [x] Sesiones terminadas se pueden reabrir y re-terminar desde la URL vieja. Fix: redirigir a `/progreso/sesion/[id]` si `finishedAt` existe.
- [x] Doble tap en "Empezar" puede crear dos sesiones abiertas (check-then-insert sin transacción; `neon-http` no soporta transacciones). Fix: índice único parcial `(user_id, routine_id) WHERE finished_at IS NULL`. Mismo problema en `duplicateRoutine` y `moveRoutineExercise` (varias sentencias no atómicas).
- [x] `addExerciseToRoutine` acepta 0 series/reps (`Number("")` → 0); `duplicateRoutine` no copia `rest_seconds`.
- [x] Un ejercicio propio ajeno se puede ver y agregar si se conoce su UUID (`progreso/[exerciseId]` y `addExerciseToRoutine` no filtran por dueño).
- [x] Gifs: respuestas opacas fallidas (404) quedan cacheadas para siempre; sin límite de tamaño del cache. Cambiar a stale-while-revalidate y acotar.
- [x] `maximumScale: 1` en el viewport bloquea el zoom (accesibilidad).
- [~] Bloqueo por cuenta (no por IP) sigue igual — pendiente throttle por IP. Hecho: formato/longitud de usuario (`^[a-z0-9._@-]{3,40}$`), tope de contraseña 128, carrera del registro capturada.
- [x] Notas / agregar serie / terminar sin señal mandan a la pantalla de error y se pierde lo escrito.

**Bajos**
- [~] Duplicados: dos `requireOwnedSession`, `fieldClass` en 5 archivos, `REST_SECONDS` en 3 lugares; `users.email/name` sin uso. Hecho: código muerto del "legacy owner" eliminado; `scrollbar-none` reemplazado.
- [x] `SessionHud` inicializa `now` con `Date.now()` → hydration mismatch en cada carga del entrenamiento.
- [ ] `ExerciseInfoSheet` sin focus trap ni `aria-labelledby`; inputs de kg/reps sin label; heatmap depende de `title`.
- [x] Búsqueda: `offset` sin validar; `ORDER BY` sin desempate por `id` (paginación puede duplicar/saltar); `%`/`_` actúan como comodines.
- [x] CSV sin protección contra fórmulas (`=`, `+`, `-`, `@` al inicio).
- [x] Foto de ejercicio propio no valida MIME en servidor. `mirrorExerciseGif` corre inline en la acción (mover a `after()`).
- [ ] Cambiar contraseña no cierra las demás sesiones; `/login` no redirige si ya hay sesión.
- [x] `getLastTimeSets` incluye sets de sesiones abandonadas (filtra `completed`, no `finished_at`).

**Datos**
- [ ] Sin historial de migraciones: `drizzle/` no existe; nada en el repo prueba que producción coincide con `schema.ts`. Fix: `drizzle-kit generate` una vez y commitear.
- [x] Faltan índices: `set_logs(exercise_id)`, `workout_sessions(user_id, finished_at)`, `sessions(expires_at)`, `exercises(user_id)`, y `pg_trgm` para el `ilike` de nombres.
- [ ] `timestamp` sin `withTimezone`; `users.username/password_hash` siguen nullable aunque ya no hace falta.

**Orden sugerido:** fechas → cola offline + SW → sesión huérfana / reabrir / doble tap → consulta del entrenamiento + índices → el resto.

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
