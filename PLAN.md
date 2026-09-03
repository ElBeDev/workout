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
- [x] Rest timer entre series (90s por defecto, +/-15s, flotante durante el entrenamiento).

**MVP (fase 1) completo.** Lo que sigue es todo fase 2 (ver sección 4).

Notas de infra que ya no hay que repetir:
- El cliente de DB (`src/db/index.ts`) es "lazy" a propósito — si se inicializa en el import top-level, `next build` truena en Vercel al analizar rutas aunque `DATABASE_URL` sí exista en el entorno de runtime.
- En Vercel, la integración de Neon prefija sus variables como `DATABASE_URL_*` si ya existe una variable llamada `DATABASE_URL` — la que de verdad lee el código es la que se llama exactamente `DATABASE_URL` (sin prefijo).
- El primer registro en `/registro` reclama automáticamente el usuario placeholder que existía antes del login (así la rutina "Espalda" creada antes de tener auth no se perdió). Ese comportamiento (`src/app/registro/actions.ts`) solo aplica mientras exista esa fila sin reclamar — no hace falta tocarlo después.

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

- Sugerencia automática de peso/reps para la próxima sesión (progressive overload asistido).
- Notas por sesión ("me sentí cansado", "subí técnica").
- Body weight tracking (peso corporal, fotos de progreso).
- Compartir rutina con un link.
- Modo offline (PWA) para gimnasios sin señal.
- Recordatorios / notificaciones ("hoy toca pierna").

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
 └─ id, user_id, routine_id, fecha, duración

SetLog (cada serie registrada durante la sesión)
 └─ id, session_id, exercise_id, numero_serie, peso, reps, completada
```

`SetLog` es la tabla clave: de ahí sale todo el historial y las gráficas de progreso.

## 7. Stack técnico (real, ya implementado)

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS — mobile-first, con `app/manifest.ts` para que sea instalable como app en el celular.
- **Backend/DB**: Neon (Postgres serverless) + Drizzle ORM. Ajustamos el plan original de Supabase por Neon porque el deploy es en Vercel y Neon se integra nativo ahí (Storage tab del proyecto).
- **Auth**: usuario + contraseña propios (scrypt vía `node:crypto`, sin dependencias extra), sesión en cookie httpOnly respaldada por tabla `sessions` (`src/lib/session.ts`, `src/lib/password.ts`).
- **Gráficas de progreso**: Recharts — peso máximo por sesión, por ejercicio.
- **Gifs/videos de ejercicios**: ExerciseDB, cacheados en nuestra propia tabla `exercises` (script `scripts/seed-exercises.ts`).
- **Storage de archivos**: Vercel Blob — ya está la variable `BLOB_READ_WRITE_TOKEN` configurada en Vercel, sin usar todavía (se necesitará cuando haya fotos de progreso o ejercicios custom del usuario).
- **Deploy**: Vercel, deploy automático en cada push a `main`.

## 8. Pantallas principales

1. **Login / Registro** — usuario + contraseña. ✅
2. **Home** — rutinas del usuario, botón "Empezar" por rutina. ✅
3. **Mis rutinas** — lista de rutinas, crear/borrar. ✅
4. **Editor de rutina** — explorador de ejercicios (grid con gif, filtro por músculo), definir series/reps/peso, quitar ejercicios. ✅
5. **Modo entrenamiento** — todos los ejercicios de la rutina, input de peso/reps por serie, gif visible, referencia de la sesión anterior, rest timer flotante. ✅
6. **Progreso** — lista de sesiones completadas + gráfica de peso máximo por ejercicio. ✅
7. **Perfil** — usuario logueado, cerrar sesión. ✅ (peso corporal queda para fase 2)

## 9. Roadmap

- ~~Semana 1: setup del proyecto (Next.js + DB + PWA), modelo de datos~~ ✅
- ~~Semana 2: catálogo de ejercicios (ExerciseDB) + CRUD de rutinas~~ ✅
- ~~Semana 3: modo entrenamiento (logueo de series) + guardado de sesiones~~ ✅
- ~~Gráficas de progreso, explorador visual de ejercicios, auth real (usuario + contraseña)~~ ✅
- ~~Reordenar ejercicios en una rutina, rest timer~~ ✅

**MVP completo.** Siguiente (fase 2, sin prisa): body weight tracking, notas por sesión, sugerencia automática de peso/reps.

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
