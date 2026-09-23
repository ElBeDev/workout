# Plan: App Web de Ejercicio (mobile-first) — estilo TrainWise

## 0. Estado actual (2026-09-22)

🟢 **En línea**: https://workout-eight-neon.vercel.app — repo en [github.com/ElBeDev/workout](https://github.com/ElBeDev/workout), deploy automático a Vercel en cada push a `main`.

En la base hoy: **3 usuarios**, 14 rutinas, 20 sesiones terminadas, 169 series registradas, 1,500 ejercicios de catálogo + 1 propio.

### Qué tiene la app hoy

**Cuentas** — usuario y contraseña propios (scrypt, sin dependencias externas), sesión en cookie httpOnly respaldada por la tabla `sessions`, bloqueo tras 8 intentos fallidos. No se pide correo, así que **no hay recuperación de contraseña** y la app lo advierte al registrarse. Multiusuario real; `users.is_admin` abre el panel de administrador.

**Catálogo de ejercicios** — 1,500 ejercicios con gif (ExerciseDB), con nombre en español generado por reglas (`name_es`), músculo, equipo e instrucciones paso a paso. La búsqueda acepta español o inglés, hay filtro por grupo muscular, y una hoja de "cómo se hace" con el gif grande. Cada usuario puede crear ejercicios propios con su foto.

**Rutinas** — crear (desde el "+" de la cabecera), renombrar, duplicar y eliminar conservando el historial (las sesiones quedan como "Rutina eliminada"). Días de la semana asignados, que alimentan el "Hoy toca" de la portada. Los ejercicios se agregan desde una hoja con el explorador; series, reps y peso objetivo se editan tocando la línea; subir, bajar y quitar viven en el menú "⋮". Cada ejercicio declara su unidad de carga: **kilos, libras o placas**.

**Entrenamiento** — el **descanso sobrevive** a salir de la pantalla y a recargar (se guarda el instante de fin en `localStorage`) y avisa con **tres pitidos** al terminar, apagables desde Perfil. La **unidad de carga se cambia desde aquí** (chip kg / lb / placas junto a cada ejercicio, que abre una hoja y lo guarda en la rutina): la máquina en libras o la polea sin kilos marcados se descubren parado enfrente, no armando la rutina. Empezar o reanudar (nunca hay dos sesiones abiertas de la misma rutina: lo garantiza un índice único parcial). HUD pegajoso con el tiempo transcurrido, un anillo de series y el descanso automático de 3 minutos al marcar una serie (±15 s, saltar, vibración al terminar). Por serie se teclea carga y reps en la unidad que toque, con lo de la vez pasada como referencia y una sugerencia de progresión (+2.5 kg, +5 lb, +1 placa o +1 rep) que se aplica con un botón. Se pueden agregar series sobre la marcha, dejar notas de la sesión y descartarla. Al terminar se cae en el resumen de la sesión con los anillos de la semana ya actualizados.

**Progreso** — totales del periodo (semana, mes o año): sesiones, series, carga y tiempo, más la tendencia contra el periodo anterior. Calendario de constancia de 14 semanas con un trío de anillos por día. Por ejercicio: récord personal, gráfica de peso / placas / reps / volumen por sesión, y su lista de sesiones. Detalle de sesión con métricas grandes, las series agrupadas por ejercicio (corregibles y borrables) y las notas. Todo el historial se exporta a CSV.

**Perfil** — **apariencia** (Sistema / Claro / Oscuro), metas semanales de los tres anillos (carga, series, días), peso corporal con gráfica, cambiar contraseña y cerrar sesión (que además purga caches y colas locales).

**Administrador** (solo `is_admin`) — lista de usuarios con su número de rutinas; entrar a uno y armarle rutinas con el mismo editor de siempre, con un banner de aviso y sin el botón de entrenar (el admin arma, no entrena por nadie). Bloque de mantenimiento con el respaldo de gifs (⚠️ hoy no operativo, ver pendientes).

**PWA y offline** — instalable, con ícono y tema propios. Service worker propio: el shell y las páginas ya visitadas abren sin señal, y las series marcadas sin conexión se encolan en `localStorage` y se sincronizan al reconectar, con un banner que lo avisa.

**Diseño** — sistema estilo Apple Fitness en claro y oscuro, con el tema forzable desde Perfil: lienzo neutro, color reservado para el dato (carga rosa, series verde, días cian), anillos, navegación de vidrio. El detalle completo está en [diseno-apple-fitness.md](./diseno-apple-fitness.md).

### Cómo se prueba

`npm run build` y `npx eslint src` son el mínimo. La referencia real es `npm run smoke`: 9 pruebas con Playwright sobre una cuenta desechable que se crea y se borra sola, y que se corre **también contra producción** con `BASE_URL=https://workout-eight-neon.vercel.app`. Para lo visual se siembra una cuenta QA con datos y se revisan capturas en claro y oscuro.

### Historial de rondas (cómo llegamos aquí)

El inventario de arriba es el estado real; esto es el orden en que se fue
construyendo, útil para entender por qué algo está como está.

**Primera tanda (2026-09-03) — MVP:**

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
- [x] Rest timer entre series: **3 minutos fijos, automático** — arranca solo al marcar una serie, cuenta regresivo en el bloque lavanda, +/-15s / Saltar. Ya no es configurable (se quitó el "Desc. s" por ejercicio y el default en Perfil para simplificar).

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

Sexta (2026-09-07): **panel de administrador**. `bener` es admin (`users.is_admin`). Perfil → "Panel de administrador" → lista todos los usuarios con su conteo de rutinas → entra a un usuario → crea una rutina para él y la arma completa (buscar/agregar ejercicios, series/reps/peso, orden) con el mismo editor de siempre — la rutina queda con `userId` del usuario destino, así que le sale directo en su Hoy/Rutinas. Un aviso "Editando como admin la rutina de <usuario>" avisa cuando no es tu propia rutina; el botón "Empezar entrenamiento" se oculta en ese caso (el admin arma, no entrena por el usuario). Ownership de rutinas ahora es "dueño O admin" en un solo lugar (`requireOwnedRoutine`); usuarios normales siguen sin poder ver ni tocar rutinas ajenas (probado: URL directa a la rutina de otro → 404).

Séptima (2026-09-07): **limpieza de la pantalla de rutina**. El bloque de "Agregar ejercicio" (buscador + chips + grid, siempre visible) se cambió por un botón compacto que abre lo mismo en una hoja deslizante desde abajo (mismo estilo que "cómo se hace"), y se cierra sola al agregar. `AddExerciseSheet.tsx` reemplaza a `AddExerciseForm.tsx`.

Octava (2026-09-20): **libras (lb) como segunda unidad de carga**, junto a kilos y placas (no todos los aparatos/mancuernas marcan kg). Al agregar o editar un ejercicio de una rutina el selector ahora tiene tres opciones (Kilos / Libras / Placas); el modo entrenamiento pide la carga en la unidad que toque. Como kg y lb comparten la misma columna `weight`, cada serie guarda además en qué unidad se registró (`set_logs.weight_unit`) para que un cambio posterior del ejercicio nunca reetiquete el historial ya guardado. Con eso: la sugerencia de progresión solo compara contra series de la misma unidad (si no hay historial en esa unidad, no sugiere carga) y usa +2.5 kg o +5 lb según toque; el detalle de sesión, la página por ejercicio, la gráfica y el CSV muestran cada serie con su unidad real tal cual se tecleó; y los volúmenes agregados (de una sesión o de un ejercicio) siempre sumen convirtiendo lb→kg primero, para que mezclar aparatos en kg y en lb no dé un número sin sentido.

Novena (2026-09-22): **rediseño visual completo al estilo Apple Fitness**. Se fue el sistema lavanda del shot de Dribbble y entró uno de lienzo neutro (negro puro en oscuro, `#f2f2f7` en claro) donde **todo el color viene del dato**: carga (rosa), series (verde), días (cian) — los tres anillos de la semana. Fuente Outfit → Inter. La Home es ahora un "Resumen" encabezado por los tres anillos con meta (`users.goal_weekly_*`, editables en Perfil), la nav es una cápsula de vidrio tipo iOS 26 que esconde las etiquetas al hacer scroll, el HUD del entrenamiento es un anillo de series que se vuelve cian y cuenta regresivo al descansar, las filas de serie tienen campos del doble de tamaño, Progreso trae selector semana/mes/año + tendencia contra el periodo anterior + récords por ejercicio + un calendario de 14 semanas donde cada día es un trío de anillos en miniatura, y al terminar un entrenamiento se cae en el resumen de la sesión con los anillos ya actualizados. El plan completo, con lo que quedó abierto, está en [diseno-apple-fitness.md](./diseno-apple-fitness.md).

**Ya está desplegado** (`1bf4729` → `acec7ac`) y verificado contra producción, no solo en local: `npm run smoke` 9/9 con `BASE_URL` apuntando a Vercel, más un recorrido con Playwright de Hoy / Progreso / Entrenar / Perfil / descartar en claro y oscuro. Tres correcciones salieron de verlo ya desplegado, en el teléfono:

- Salían dos porcentajes juntos en la tarjeta de tendencia sin decir cuál era cuál (`acbac55`).
- Descartar un entrenamiento confirmaba en un bloque inline que se desbordaba de la tarjeta de "En curso" y dejaba el botón cortado por el borde de la pantalla; ahora es una hoja de acción, igual desde Home que desde la sesión (`16419ee`).
- Perfil le explicaba al usuario de dónde salen los gifs y que hay un almacenamiento propio; eso es plomería y se fue a /admin → "Mantenimiento" (`acec7ac`).

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
- Tercera ronda de migraciones a mano (mismo método): `exercises.gif_blob_url / user_id / is_custom`, `users.failed_logins / locked_until`.
- Sexta migración a mano: `users.is_admin boolean default false`, `bener` puesto en `true`. Y se revirtió una migración: `users.rest_seconds` / `routine_exercises.rest_seconds` (columnas del descanso configurable) se **borraron** al hacerlo fijo en 3 min — si ves esas columnas mencionadas en commits viejos, ya no existen.
- Octava migración a mano: `set_logs.weight_unit text not null default 'kg'`.
- Unidad de carga: el selector existía desde la octava ronda pero estaba enterrado en el editor de la rutina, y se notó — al 2026-09-22 los **73 ejercicios de rutina estaban en `kg`** y las 171 series registradas también, o sea que nadie lo usó nunca. Por eso se movió al entrenamiento (`LoadUnitPicker`). Al cambiarla se reescribe `routine_exercises.load_unit`, nunca el historial: cada serie conserva su propia `set_logs.weight_unit`.
- Novena migración a mano (aditiva, con defaults, sin tocar datos): `users.goal_weekly_volume_kg int not null default 5000`, `users.goal_weekly_sets int not null default 60`, `users.goal_weekly_days int not null default 4` — las metas de los tres anillos.
- El volumen de los anillos y de las tendencias **no cuenta las series en placas**: no hay forma honesta de convertir "3 placas" a kilos, y un número inventado arruinaría la métrica. Las lb sí se convierten a kg.
- Toda la documentación vive en `docs/` (`PLAN.md` se movió ahí con `git mv`).
- Cuarta ronda de migraciones a mano: índices (`set_logs(exercise_id)`, `workout_sessions(user_id, finished_at)`, `sessions(expires_at)`, `exercises(user_id)`, `routine_exercises(routine_id)`) y el índice único parcial `workout_sessions(user_id, routine_id) WHERE finished_at IS NULL` (una sola sesión abierta por rutina). Todos declarados también en `schema.ts`.
- Al cerrar sesión, `LogoutButton` borra los caches `pages-*` y las colas `workout:*` de `localStorage`, y avisa al SW (`purge-pages`). El SW (v3) no cachea respuestas redirigidas ni `/login`.
- Vercel Blob: `BLOB_READ_WRITE_TOKEN` es un secreto de solo escritura en Vercel (no se puede revelar ni bajar con `vercel env pull`), así que el barrido de gifs se hace desde la app: **/admin → "Mantenimiento"** → botón que copia en tandas de 6 los gifs de los ejercicios que usa la cuenta admin. Estaba en Perfil y se movió al panel de admin (2026-09-22): es plomería interna y los usuarios no se tienen que enterar de dónde viven los gifs. El bloque ni siquiera se renderiza si `blobConfigured()` es falso (en local, por ejemplo). Cada gif nuevo debería copiarse solo al agregarlo a una rutina. `scripts/mirror-gifs.ts` sigue ahí por si algún día se tiene el token local.
- ⚠️ **El espejado de gifs nunca ha corrido, y hay dos causas** (diagnosticado el 2026-09-22 con /admin → Mantenimiento → "Diagnosticar", que prueba cada pieza por separado):
  1. **`BLOB_READ_WRITE_TOKEN` llega vacío al runtime.** La clave sí existe en `process.env` (junto a `BLOB_STORE_ID` y `BLOB_WEBHOOK_PUBLIC_KEY`), pero su valor mide **0 caracteres**, tanto en acceso estático como dinámico — o sea que no es que Next la fije en el build, es que está vacía en Vercel. Como `blobConfigured()` es falso, la subida ni se intenta. La descarga del gif externo sí funciona (probada: 107 kB), así que ExerciseDB no es el problema.
  2. **El store `workout-blob` es privado** (`vercel blob get-store store_12HfvvHadJ85rCxU` → `Access: Private`, 0 archivos, conectado al proyecto desde hace 19 días). Un store privado [no sirve archivos por URL pública](https://vercel.com/docs/vercel-blob/private-storage): hay que pasarlos por una función con autenticación o por URLs firmadas. El código actual sube con `access: "public"` y guarda `blob.url` para meterla directo en un `<img>`, así que aunque el token se arregle, los gifs espejados no se verían.

  **Qué falta decidir** (necesita el panel de Vercel, no se puede desde el CLI: el token no se puede leer y crear un store nuevo es un recurso facturable):
  - **Opción A (recomendada)**: crear un store de Blob **público**, conectarlo al proyecto (eso rellena el token bien) y pulsar "Copiar gifs" en /admin. Los gifs de ejercicios no son datos privados, y el código ya asume URLs públicas: cero cambios de código.
  - **Opción B**: quedarse con el store privado y servir los gifs por una ruta propia (`/api/gif/[id]`) que los lea con el token. Más código, más invocaciones de función y más latencia por imagen.

  Mientras tanto la app funciona: los gifs se sirven desde `static.exercisedb.dev` (`coalesce(gif_blob_url, gif_url)` cae al externo). El riesgo es quedarse sin imágenes si ese servidor se cae.
- Tema: `data-theme="light"|"dark"` en `<html>` manda sobre `prefers-color-scheme`. Lo pone `src/lib/theme-script.ts`, inyectado en `<head>` para que corra **antes del primer pintado** (si no, parpadea). Por eso el bloque de tokens oscuros aparece dos veces en `globals.css` (media query guardada + atributo) y el variante `dark:` de Tailwind se redefine con `@custom-variant` para que siga al atributo. El `theme-color` también lo pone ese script: un meta por media query mentiría con el tema forzado.
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
   - Por cada serie: input rápido de **peso** (kg o nº de placas, según el ejercicio) y **reps**, botón "listo" para marcar la serie — dispara el descanso automático de 3 min. ✅
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
 └─ id, username, password_hash, is_admin, failed_logins, locked_until, created_at

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
    target_weight (opcional), load_unit ('kg' | 'lbs' | 'plates')

WorkoutSession (una ejecución real de la rutina)
 └─ id, user_id, routine_id (nullable, SET NULL al borrar la rutina),
    started_at, finished_at (null = en curso), notes

SetLog (cada serie registrada durante la sesión)
 └─ id, session_id, exercise_id, set_number, weight, weight_unit ('kg' | 'lbs',
    la unidad en la que se tecleó ese `weight` — independiente del load_unit
    actual del ejercicio), plates, reps, completed, logged_at — único por
    (session_id, exercise_id, set_number)

BodyWeight
 └─ id, user_id, weight, logged_at
```

Borrados: `users` → cascada a todo lo suyo (rutinas, sesiones, sets, pesos, ejercicios propios, sesiones de login). `routines` → cascada a `routine_exercises`; las `workout_sessions` se quedan con `routine_id = null`.

`SetLog` es la tabla clave: de ahí sale todo el historial y las gráficas de progreso.

## 7. Stack técnico (real, ya implementado)

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 — mobile-first, con `app/manifest.ts` para que sea instalable como app en el celular.
- **Diseño**: sistema propio estilo **Apple Fitness** — ver [diseno-apple-fitness.md](./diseno-apple-fitness.md). Tokens en `src/app/globals.css` (lienzo `#000` / `#f2f2f7`, superficies neutras, y los tres colores del dato: `--ring-load` rosa, `--ring-sets` verde, `--ring-days` cian, con valores distintos por modo para pasar contraste). Primitivas en `src/components/ui.tsx` (`Card`, `MetricTile`, `StatGrid`, `GroupedList`, `TrendPill`, `Label`, botones, `Chip`, `Input`, `PageHeader` con large title) y anillos en `src/components/Rings.tsx`. Fuente Inter vía `next/font` (SF Pro no se puede usar fuera de plataformas Apple). Iconos `lucide-react`. *(Antes: sistema lavanda inspirado en [este shot de Dribbble](https://dribbble.com/shots/26265316-Ai-Powered-Smarter-Home-Workout-App-Design), con fuente Outfit.)*
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
2. **Home ("Resumen")** — fecha + large title, tarjeta héroe con los **tres anillos de la semana** (carga / series / días) y su leyenda, racha, tarjeta de "Entrenamiento en curso" (continuar / descartar), "Hoy toca" según días asignados con el ▶ grande, y el resto de las rutinas en lista agrupada. ✅
3. **Mis rutinas** — lista + crear. ✅
4. **Detalle de rutina** — stats (ejercicios / series / músculos), CTA, lista de ejercicios (tocar gif = cómo se hace; editar series/reps/peso inline; subir/bajar; quitar); botón compacto "Agregar ejercicio" que abre el explorador (grid con gif, chips por músculo, búsqueda es/en, "i" de info, crear ejercicio propio) como hoja deslizante en vez de ocupar la pantalla siempre; ajustes (nombre, días de la semana, duplicar, eliminar). ✅
5. **Modo entrenamiento** — casilla de carga en kg, lb o placas según el ejercicio; HUD de vidrio pegajoso (un número grande + anillo de series, que se vuelve cian y cuenta regresivo en el descanso automático de 3 min al marcar una serie, con −15s / Saltar / +15s), aviso de series en cola sin señal, por ejercicio: sugerencia de peso con "Usar", filas por serie (kg + reps, placeholder de la vez pasada, ✓ con spinner / ámbar si quedó en cola), "Agregar serie", notas de la sesión, terminar / descartar. ✅
6. **Progreso** — selector semana/mes/año, tarjeta de tendencia de carga contra el periodo anterior, totales (sesiones / series / carga / tiempo), calendario de constancia de 14 semanas con un trío de anillos por día, por ejercicio (mejor marca, última sesión, gráfica peso/reps/volumen, lista de sesiones), sesiones completadas → detalle con series editables, duración, volumen y notas. ✅
7. **Perfil** — usuario, **metas semanales de los anillos**, link a "Panel de administrador" (si `isAdmin`), peso corporal (registro + gráfica), cambiar contraseña, exportar CSV, cerrar sesión. ✅
8. **Cómo se hace** (bottom sheet) — gif grande, músculo, equipo, pasos (en inglés). ✅
9. **Offline** — banner sin conexión, páginas visitadas abren desde cache, `/offline` para las no visitadas. ✅
10. **Admin** (solo `isAdmin`) — lista de usuarios con su conteo de rutinas → entra a uno → ve sus rutinas y crea una nueva → la arma con el mismo editor de siempre (banner "Editando como admin la rutina de <usuario>"). ✅

## 9. Roadmap

- ~~Semana 1: setup del proyecto (Next.js + DB + PWA), modelo de datos~~ ✅
- ~~Semana 2: catálogo de ejercicios (ExerciseDB) + CRUD de rutinas~~ ✅
- ~~Semana 3: modo entrenamiento (logueo de series) + guardado de sesiones~~ ✅
- ~~Gráficas de progreso, explorador visual de ejercicios, auth real (usuario + contraseña)~~ ✅
- ~~Reordenar ejercicios en una rutina, rest timer~~ ✅

- ~~Fase 2: sesión en curso, feedback al guardar, series extra, notas, instrucciones, nombres en español, detalle de sesión, gráfica peso/reps/volumen, "Hoy toca", racha, duplicar, contraseña, peso corporal, ícono, offline de lectura~~ ✅
- ~~Tercera ronda (sección 12): sugerencia de peso, corregir series pasadas, ejercicios propios, gifs en Blob, cola offline, descanso configurable, heatmap, CSV, bloqueo de login, suite de humo~~ ✅
- ~~Cuarta ronda (sección 13): auditoría y arreglo de los hallazgos altos y medios~~ ✅
- ~~Quinta: placas como unidad de carga~~ ✅
- ~~Sexta: descanso fijo de 3 min (se quita la config), panel de administrador~~ ✅
- ~~Séptima: "Agregar ejercicio" pasa de panel siempre visible a botón + hoja deslizante~~ ✅
- ~~Octava: libras (lb) como unidad de carga alterna a kg, con historial por serie fiel a como se tecleó~~ ✅
- ~~Novena: rediseño visual completo al estilo Apple Fitness (anillos semanales con metas, tendencias, récords, calendario de constancia, resumen post-entrenamiento)~~ ✅

**Queda abierto (sin prisa), en este orden sugerido:**
1. **Arreglar el espejado de gifs**: diagnosticado (token vacío + store privado, ver notas de infra), falta decidir entre store público u servirlos por una ruta propia. Después, pulsar "Copiar gifs" en /admin → Mantenimiento.
2. Migraciones versionadas (`drizzle-kit generate` + carpeta `drizzle/`) para que el repo pruebe que producción coincide con `schema.ts`.
3. Throttle de login por IP (hoy el bloqueo es por cuenta).
4. Accesibilidad de la hoja "cómo se hace" (focus trap, `aria-labelledby`) y consolidar helpers duplicados (`requireOwnedSession`).
5. Diseño, lo que quedó marcado con ⏳ en [diseno-apple-fitness.md](./diseno-apple-fitness.md): aviso de récord *durante* la sesión, carrusel de premios, compartir la sesión como imagen, skeletons y splash screens de iOS, y el colapso del título a barra de vidrio al hacer scroll.
6. Producto: plantillas de rutina (Push/Pull/Legs) para que el admin las asigne rápido, compartir rutina por link, push notifications, fotos de progreso, traducir las instrucciones paso a paso (hoy en inglés).

## 10. Mapa del código

```
src/app/
  layout.tsx            Fuente Inter, viewport/theme-color, Connectivity, BottomNav
  globals.css           Tokens de diseño (light/dark) y @theme de Tailwind
  manifest.ts, icon.png PWA manifest + favicon
  error.tsx             Error global con "Reintentar"
  offline/              Fallback del service worker para páginas no visitadas
  page.tsx              Home: sesión en curso, stats semanales, "Hoy toca", rutinas
  login/, registro/     Auth (page + actions)
  rutinas/page.tsx      Lista agrupada + NewRoutineSheet (el "+" de la cabecera abre la
                        hoja de crear; actions.ts: createRoutine)
  rutinas/[id]/         Detalle: page, actions (add/remove/move/update ejercicio,
                        rename/delete/duplicate rutina, setRoutineDays — todas con
                        requireOwnedRoutine, que ahora deja pasar también a un admin),
                        AddExerciseSheet (botón compacto + hoja con el explorador),
                        ExerciseTargetsEditor, ExerciseRowMenu (el "⋮" con subir / bajar /
                        quitar), RoutineSettings (nombre, días, duplicar, eliminar);
                        banner "Editando como admin" si no es tu rutina
  entrenar/actions.ts   startSession (reanuda si hay abierta), discardSession
  entrenar/[sessionId]/ page, actions (logSet upsert, syncSets, addExtraSet, saveNotes,
                        finishSession — con requireOwnedSession), SetRow (guardado online /
                        cola offline), PendingSync, SessionNotes, error.tsx
  progreso/             Lista de sesiones, heatmap y ejercicios; [exerciseId] = gráfica;
                        sesion/[id] = detalle (SetRowEditor para corregir/borrar series)
  perfil/               Usuario, metas semanales de los anillos (updateGoals), link a /admin
                        (si isAdmin), peso corporal, contraseña, CSV, logout
  ejercicios/actions.ts createCustomExercise
  api/exercises/search  Búsqueda/browse (q en es/en, bodyPart, offset); catálogo + propios del usuario
  api/export            CSV del historial del usuario
  admin/                page (lista de usuarios + bloque de mantenimiento con el copiado
                        de gifs a Blob), usuarios/[userId]/page.tsx (rutinas de
                        ese usuario + crear una), actions.ts (createRoutineForUser) —
                        todo detrás de requireAdmin()
src/components/
  ui.tsx                Primitivas del sistema de diseño (Card, MetricTile, StatGrid,
                        GroupedList, TrendPill, PageHeader con large title, botones)
  Rings.tsx             Anillos de Apple Fitness en SVG: Ring, RingTrio, RingLegend,
                        MiniRings (track al 20 %, degradado, segunda vuelta al pasar del 100 %)
  ConsistencyCalendar.tsx  14 semanas; cada día es un trío de anillos en miniatura
  BottomNav.tsx         Nav flotante (oculto en /login y /registro)
  Connectivity.tsx      Registra sw.js, calienta el cache de la ruta actual, banner offline
  ExercisePicker.tsx    Grid de ejercicios con chips por músculo, "i" de info y "Cargar más"
  ExerciseInfoSheet.tsx Bottom sheet con gif grande + pasos
  ExerciseThumb.tsx     <img> con fallback a ícono si el gif falla
  SessionHud.tsx        HUD de vidrio del entrenamiento: anillo de series (verde) que se
                        vuelve cian y cuenta regresivo durante el descanso
  PendingButton.tsx     Botón de submit con spinner genérico
  DiscardSessionButton.tsx  Descartar sesión con confirmación inline
  ExerciseProgressChart.tsx AreaChart con toggle peso/reps/volumen
  BodyWeightChart.tsx   AreaChart del peso corporal
  SuggestionPill.tsx    "Sube a X kg" / "Repite" con botón Usar
  CustomExerciseForm.tsx  Alta de ejercicio propio dentro del explorador
src/db/
  schema.ts             Fuente de verdad del modelo (Drizzle)
  index.ts              Cliente Neon lazy
  exercise-gif.ts       coalesce(gif_blob_url, gif_url)
  queries.ts            getRoutineSummaries, getOpenSession, getWeeklyStats,
                        getWeeklyRings (los tres anillos de la semana), getPeriodStats
                        (totales + tendencia contra el periodo anterior), getDailyTraining,
                        getPersonalRecords, getSessionSummaries
src/lib/
  admin.ts               isAdminUser, requireAdmin (redirige a Home si no es admin)
  session.ts            createSession (purga expiradas) / destroySession / getCurrentUserId / requireUserId
  password.ts           scrypt hash + verify
  body-parts.ts         Etiquetas en español de los grupos musculares
  dates.ts              Zona horaria MX, día de la semana, clave de semana, "hace N días"
  translate-exercise.ts Traductor por reglas de nombres de ejercicio
  format.ts             fmtKg / fmtNumber / fmtMinutes / fmtClock para las métricas
  suggest.ts            Unidades (kg/lb/placas), regla de progresión (+2.5 kg
                        o +5 lb / +1 rep / repetir), conversión lb→kg para volúmenes
  offline-queue.ts      Cola de series en localStorage
  blob.ts               mirrorExerciseGif, pendingGifIds, uploadExercisePhoto (no-op sin token)
public/sw.js            Service worker (app shell + páginas visitadas + gifs; VERSION v3)
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
| `99ae318` | Placas como unidad de carga por ejercicio (kg o nº de placas) en rutina, entrenamiento, sugerencia, detalle, gráfica y CSV |
| `853fbc2` | Arreglo de la auditoría: fechas en hora MX, sesiones huérfanas/terminadas/doble tap, consulta única del entrenamiento + índices, SW v3 sin HTML redirigido y purga al cerrar sesión, cola offline validada y por usuario, ownership en ejercicios propios, varios bajos |
| `250eeff` | Descanso fijo automático de 3 min; se quita "Desc. s" por ejercicio y el default en Perfil, se borran `rest_seconds` de `users` y `routine_exercises` |
| `77e4b1d` | Panel de administrador: `users.is_admin`, `/admin`, `/admin/usuarios/[userId]`, ownership "dueño o admin" en `requireOwnedRoutine` |
| `59f1ea7` | "Agregar ejercicio" pasa de panel fijo a botón + hoja deslizante (`AddExerciseSheet`, reemplaza `AddExerciseForm`) |
| `79b2f35` | PLAN.md: rellenar el commit hash de la fila de `AddExerciseSheet` |
| `462e472` | Libras (lb) como unidad de carga alterna a kg: selector de 3 opciones, `set_logs.weight_unit` por serie, sugerencia/volumen/CSV/gráfica conscientes de la unidad |
| `71b4433` | PLAN.md: rellenar el commit hash de la fila de la unidad `lb` |
| `1bf4729` | Rediseño visual completo al estilo Apple Fitness: tokens nuevos (lienzo neutro, color por dato), Inter, anillos en SVG, Home como "Resumen", metas semanales (`users.goal_weekly_*`), nav de vidrio, HUD con anillo, Progreso con tendencia/récords/calendario de anillos, resumen post-entrenamiento; documentación movida a `docs/` |
| `f4257e7` | PLAN.md: fila del changelog del rediseño |
| `acbac55` | Progreso: etiquetar "series" en el porcentaje chico de la tarjeta de tendencia (salían dos porcentajes juntos sin decir cuál era cuál) |
| `16419ee` | Descartar entrenamiento confirma en hoja de acción: inline se desbordaba de la tarjeta de "En curso" y el botón quedaba cortado por el borde |
| `acec7ac` | Copiado de gifs a Blob sale de Perfil y se va a /admin → "Mantenimiento"; sin `BLOB_READ_WRITE_TOKEN` el bloque ni se renderiza |
| `452bdf8` | Presentación de los gifs: escenario propio con hairline y esqueleto, atenuado en oscuro, la hoja deja de estirarlos a ancho completo (tope 300 px), nombres a dos líneas, explorador limpio |
| `28715f2` | Selector de tema en Perfil (Sistema / Claro / Oscuro): `data-theme` manda sobre `prefers-color-scheme`, aplicado antes del primer pintado |
| `f6667b9` | La unidad de carga (kg / lb / placas) se cambia desde el entrenamiento con un chip por ejercicio; antes estaba enterrada en el editor de la rutina y los 73 ejercicios seguían en kg |
| `a770f02` | Descanso persistente (se guarda el instante de fin, no los segundos) y tres pitidos al terminar con Web Audio; interruptor en Perfil |

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
