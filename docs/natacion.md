# Natación

Estado: **Fase 1 (MVP) hecha (2026-09-22)**, pendiente de commit y de su fila
en el changelog de [PLAN.md](./PLAN.md). Pedido original: la app ya tenía una
noción de "natación" pero no había nada real detrás, y tocaba al día
siguiente. Referencia de producto:
[MySwimPro](https://apps.apple.com/us/app/myswimpro-1-swim-workout-app/id994386450) —
entrenamientos de alberca estructurados por bloques (calentamiento / serie
principal / patada / enfriamiento), cada bloque con estilo, repeticiones,
distancia y descanso, más ritmo y SWOLF calculados del log.

Documento vivo: se actualiza conforme se decida y se suba cada fase, mismo
formato que [mejoras-progreso.md](./mejoras-progreso.md).

## 0. Lo que hay hoy (por qué no sirve)

No es que falte una pantalla — falta el modelo de datos. Lo que existe:

- **`bener`** tiene una rutina real llamada **"Natación"** (día miércoles),
  con **un ejercicio propio**: "Swimming (free)" / "Natación libre (min)",
  `body_part = "cardio"`, sin peso objetivo, `target_reps = 45`. Es un hack:
  "reps" en realidad quiere decir "minutos". Al entrenarla, la app pide
  "carga" y "reps" por serie como si fuera pesas — no hay dónde poner
  distancia, estilo ni descanso.
- **`karizmendi@grupoargue.com`** tiene una rutina **"Alberca"** (también
  miércoles) con **cero ejercicios** — un placeholder vacío. Si la empieza
  hoy, "Empezar entrenamiento" la manda a una pantalla de entrenamiento sin
  nada que loguear.
- El esquema entero (`routine_exercises`: series/reps/peso objetivo,
  `set_logs`: peso/unidad/placas/reps) está pensado para carga × repeticiones.
  No hay columna para distancia, estilo o descanso en ningún lado.

**Otra cosa que no encaja, y es más de fondo que el esquema:** el modo
entrenamiento actual funciona porque el celular está a la mano entre serie y
serie de pesas. En la alberca el teléfono no entra al agua — nadie va a
marcar cada 100 m parado goteando. El patrón real de una app de natación sin
reloj conectado (esta app no tiene integración con Apple Watch / Garmin) es
**planear antes, loguear un resumen después**: armas la serie en la app,
nadas con el reloj de la alberca o de memoria, y al salir metes lo que de
verdad hiciste. Diseñar esto como "logueo en vivo, serie por serie" (calcado
del modo pesas) sería construir para un flujo que nadie va a usar parado en
el borde de la alberca.

## 1. Decisión de arquitectura (a confirmar antes de tocar el esquema)

**Opción A — modelo propio para natación (recomendada).** `routines` gana
`kind` ('fuerza' | 'natacion', default 'fuerza' para no tocar las que ya
existen). Una rutina de natación no tiene `routine_exercises`, tiene
`swim_blocks` (ver §2): la "serie principal" de una alberca no es "un
ejercicio con N series", es una secuencia de bloques con etiqueta propia
(calentamiento, principal, patada, drill, enfriamiento). Se reutiliza
`workout_sessions` tal cual (arranca/termina/notas ya sirven para cualquier
tipo), y sólo el contenido de adentro (qué se plantea y qué se loguea)
cambia según `kind`.

- A favor: el esquema de pesas no se toca ni se le pegan columnas que sólo
  significan algo para un tipo de rutina. Mismo principio que ya está
  decidido en el proyecto con las placas: "no hay forma honesta de convertir
  3 placas a kilos" — aquí tampoco hay forma honesta de que "reps" signifique
  a veces repeticiones y a veces minutos.
- En contra: son tablas y pantallas nuevas — un editor de bloques en vez de
  reusar `AddExerciseSheet`/`ExerciseTargetsEditor`, y una pantalla de
  entrenamiento distinta a la de pesas.

**Opción B — estirar el modelo actual.** Agregar `distance_meters`,
`stroke`, `rest_seconds` nullable a `routine_exercises` y `set_logs`; un
"ejercicio" de natación viviría en el catálogo (`exercises`) con
`body_part = 'natacion'`. La pantalla de entrenamiento detectaría ese
`body_part` y pintaría otros inputs.

- A favor: reusa casi toda la plomería (rutinas, sesiones, "Hoy toca",
  racha, notas, CSV) sin tablas nuevas.
- En contra: exactamente el patrón que el proyecto ya evitó con placas y con
  kg/lb — un campo que cambia de significado según el contexto es la
  clase de bug que ya costó el de la duración de sesión (ver
  [mejoras-progreso.md §1](./mejoras-progreso.md)). Además la "serie
  principal" real (8×100 libre, descanso 15") no cabe en "un ejercicio con
  N series objetivo": son bloques con su propio orden y etiqueta, no
  repeticiones de la misma fila.

Mi recomendación es **A**. Es más trabajo de pantallas, pero el dato queda
honesto y no hereda al segundo mes el mismo tipo de bug que la duración de
sesión.

**Decisión (2026-09-22): A**, tal cual se recomendaba arriba.

## 2. Modelo de datos propuesto (Opción A)

```
Routine
 └─ + kind text not null default 'fuerza'  ('fuerza' | 'natacion')

SwimBlock (el plan — vive en vez de RoutineExercise cuando kind = 'natacion')
 └─ id, routine_id, sort_order,
    label ('calentamiento' | 'principal' | 'patada' | 'drill' | 'enfriamiento' | 'libre'),
    stroke ('libre' | 'dorso' | 'pecho' | 'mariposa' | 'combinado' | 'patada' | 'drill'),
    reps int (cuántas repeticiones del bloque, ej. 8),
    distance_meters int (por repetición, ej. 100),
    rest_seconds int nullable (descanso entre repeticiones),
    notes text nullable

SwimBlockLog (lo real — vive en vez de SetLog para esas sesiones)
 └─ id, session_id, swim_block_id,
    completed boolean,
    actual_reps int nullable (si nadó menos o más de lo planeado),
    actual_distance_meters int nullable (total nadado del bloque),
    actual_seconds int nullable (tiempo total del bloque, para ritmo),
    logged_at

WorkoutSession — sin cambios de esquema, se reutiliza igual para ambos kinds
```

Distancia siempre en metros (albercas en México son de 25 m o 50 m; a
diferencia de kg/lb no hay un caso real de yardas que justifique un
selector de unidad — validar con datos si algún día hace falta).

Ritmo (min/100 m) y "distancia total" de una sesión salen calculados de
`SwimBlockLog`, igual que hoy `volumeKg` sale calculado de `set_logs` — sin
guardar un total aparte que se pueda desincronizar.

## 3. Pantallas y flujos

- **Rutinas — crear.** La hoja de "Nueva rutina" gana un selector Fuerza /
  Natación (persiste en `kind`, no se puede cambiar después — cambiar de
  tipo a medio camino no tiene un caso de uso real).
- **Rutinas — detalle (natación).** En vez de la lista de ejercicios con
  "Agregar ejercicio", una lista de bloques con "Agregar bloque" (hoja con
  etiqueta, estilo, repeticiones, distancia, descanso, notas). Reordenar /
  quitar igual que hoy con ejercicios.
- **Entrenar (natación).** HUD con el tiempo transcurrido (se reutiliza
  `SessionHud` sin el anillo de series, que no aplica). Debajo, el plan como
  checklist: cada bloque con un check "Hecho" y, opcional, campos de
  distancia/tiempo reales si el usuario los quiere meter con más detalle
  (por defecto puede marcarlo "hecho tal cual" sin re-teclear números).
  "Terminar entrenamiento" pide un resumen si no se llenó por bloque:
  distancia total y tiempo total (el tiempo puede pre-llenarse con la
  duración de la sesión).
- **Progreso.** Las sesiones de natación no aportan carga/series (son 0 con
  honestidad, igual que hoy las placas no aportan volumen) pero sí tiempo
  entrenado. Nueva sección/tarjeta de natación: distancia total del periodo,
  ritmo promedio, gráfica de distancia por sesión — mismo patrón que
  `ExerciseProgressChart` pero por rutina de natación en vez de por
  ejercicio. El calendario de constancia puede seguir contando el día
  aunque el anillo de carga no se mueva.
- **Home ("Hoy toca").** No cambia: ya filtra por `routine.days`
  sin importar el tipo. Sólo cambia a dónde lleva "Empezar" — a la pantalla
  de entrenamiento de natación si `routine.kind === 'natacion'`.

## 4. Fases

**Fase 1 (MVP — que mañana ya sirva de verdad): hecha (2026-09-22).**
1. [x] Migración versionada `drizzle/0001_faulty_franklin_storm.sql`:
   `routines.kind` (default `'fuerza'`), tablas `swim_blocks` y
   `swim_block_logs`. Aplicada contra Neon, `db:push` sin diferencias.
2. [x] Selector de tipo (Fuerza / Natación) en "Nueva rutina"
   (`NewRoutineSheet`); editor de bloques en el detalle
   (`SwimBlockSheet` para agregar/editar, `SwimBlockRowMenu` para
   subir/bajar/quitar, mismo patrón que el editor de ejercicios). El tipo no
   se puede cambiar después de creada — no hay UI para eso, a propósito.
3. [x] Modo entrenamiento de natación: checklist de bloques
   (`SwimBlockRow`, un botón "Hecho" por bloque con la distancia real
   editable, prellenada con lo planeado) en vez de series por ejercicio.
   `SessionHud` se reutilizó tal cual (con `progressLabel="Bloques"`); el
   descanso automático de pesas no aplica y no se dispara. `finishSession`,
   `saveNotes` y `discardSession` se reutilizaron sin cambios — ya eran
   agnósticas al tipo de rutina.
4. [x] Progreso: tarjeta "Natación" (distancia total y ritmo del periodo,
   `getSwimStats`) debajo de los 4 tiles, sólo si hay al menos una sesión de
   natación en el periodo. La lista general de "Sesiones" ahora muestra
   distancia en vez de "N series" para las sesiones de natación
   (`getSessionSummaries` gana `routineKind` y `distanceMeters`). El detalle
   de una sesión de natación (`/progreso/sesion/[id]`) muestra sus propios
   bloques con duración/distancia/ritmo en vez de series por ejercicio.
5. [x] Migrada la rutina "Natación" de `bener`: se borró el ejercicio hack
   ("Swimming (free)", no se usaba en ningún otro lado — confirmado con una
   consulta antes de tocar nada) y se le armaron 4 bloques reales:
   calentamiento 400 m libre, principal 8×100 libre descanso 15 s, patada
   4×50 descanso 20 s, enfriamiento 200 m libre suave. La rutina "Alberca" de
   `karizmendi@grupoargue.com` sólo se corrigió a `kind = 'natacion'`, sin
   inventarle contenido — la arma ella.

**Verificado**: `npm run build`, `npx eslint src` y `npm run smoke` (9/9) en
verde; recorrido completo en el navegador con Playwright (crear rutina de
natación, agregar 3 bloques, entrenar marcando 2 de 3 con distancia real
ajustada, terminar, ver el detalle de la sesión con distancia/ritmo
correctos, ver la tarjeta de natación en Progreso) en una cuenta QA
desechable.

**Fase 2 (una vez que se use un par de semanas):**
- Logueo por bloque con distancia/tiempo reales (no sólo "hecho"), para
  ritmo por bloque en vez de sólo por sesión.
- Plantillas de rutina de natación (base aeróbica, sprints, series de
  técnica) — mismo pendiente que ya existe para pesas en
  [PLAN.md §9.6](./PLAN.md).
- SWOLF si el detalle por bloque ya está (brazadas + tiempo).
- Catálogo de drills con explicación (equivalente al "cómo se hace" de
  pesas, sin gif porque ExerciseDB no tiene natación — texto o link).

## 5. Datos existentes — resuelto (2026-09-22)

- Rutina **"Natación"** de `bener` (`105927c2-ed7b-4e48-9b2c-35c7c079eb02`):
  `kind = 'natacion'`, con 4 bloques reales (ver §4.5). El ejercicio hack
  "Swimming (free)" (`9a1e7f45-…`) y su fila en `routine_exercises` se
  borraron — no se usaban en ningún otro lado.
- Rutina **"Alberca"** de `karizmendi@grupoargue.com`
  (`18d1a88c-c79f-46b2-8f49-28ef35587d05`): `kind = 'natacion'`, sin bloques
  — se dejó vacía a propósito, ella arma su plan.

## 6. Decisiones ya tomadas (para no volver a discutirlas)

- Arquitectura: **Opción A** completa desde el día 1 (tablas nuevas), no la
  versión recortada — ver §1.
- Sólo alberca por ahora. "Aguas abiertas" (sin descanso entre repeticiones,
  distancia por tramo en vez de por vuelta) queda fuera hasta que alguien lo
  pida de verdad.
- El logueo en el modo entrenamiento es un checklist por bloque con
  distancia real editable, **no** series/tiempo por repetición en vivo — ver
  el porqué en §0.

## 7. Pendiente para una fase 2 (sin empezar)

- Logueo por bloque con distancia/tiempo reales por repetición (no sólo el
  total del bloque), para ritmo por bloque en vez de sólo por sesión.
- Plantillas de rutina de natación (base aeróbica, sprints, series de
  técnica) — mismo pendiente que ya existe para pesas en
  [PLAN.md §9.6](./PLAN.md).
- SWOLF, una vez que el detalle por repetición exista (brazadas + tiempo).
- Catálogo de drills con explicación (equivalente al "cómo se hace" de
  pesas; sin gif porque ExerciseDB no tiene natación).
- Duplicar una rutina de natación ya funciona (`duplicateRoutine` copia
  `swim_blocks`), pero no se probó a fondo con admin construyendo para otro
  usuario — revisar si alguna vez se usa esa combinación.
