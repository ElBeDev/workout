# Mejoras a Progreso (acordado 2026-09-23)

Estado: **hecho (2026-09-22)**, pendiente de commit y de su fila en el
changelog de [PLAN.md](./PLAN.md) — mismo formato que
[siguiente-ronda.md](./siguiente-ronda.md).

Documento vivo: conforme se suba cada punto se marca aquí y se agrega su fila
al registro de cambios de [PLAN.md](./PLAN.md), como manda
[la convención](./README.md#convenciones).

## Orden de ataque

1. [x] **La duración de sesión está corrupta** — bug de datos, no una mejora de producto
2. [x] 1RM estimado por ejercicio
3. [x] Cobertura muscular
4. [x] Tendencia de frecuencia, no sólo de carga
5. [x] Decidir si el selector de rango filtra toda la pantalla — se eligió B

---

## 1. La duración de sesión está corrupta

**No es una sugerencia — es un bug encontrado revisando datos reales el
2026-09-23.** De las 21 sesiones terminadas reales que hay hoy (sin cuentas
QA), **5 tienen una duración mayor a 4 horas — el 24 %**:

| Usuario | Sesión | Huérfana | Series | Última serie vs. fin | Duración mostrada |
|---|---|---|---|---|---|
| `bener` | `88f71ff5…` | sí (routine_id null) | 0 | — | **24,486 min (17 días)** |
| `bener` | `e64fa962…` | sí (routine_id null) | 1 | la única serie, justo al inicio | **19,012 min (13 días)** |
| `karizmendi@…` | `d03a4cb2…` | no | 12 | última serie 4 s antes de terminar | **5,828 min (4 días)** |
| `erika gordillo` | `579f48de…` | no | 19 | última serie 2.5 días antes de terminar | **3,205 min (2.2 días)** |
| `karizmendi@…` | `4fc14e4a…` | no | 8 | última serie 3 s antes de terminar | **475 min (8 h)** |

Esto contamina tres lugares: el tile "Tiempo" de Progreso (`getPeriodStats`,
suma sin límite), la duración que muestra cada fila de la lista de sesiones
(`getSessionSummaries`), y el stat "Duración" del detalle de una sesión. Si
`bener` abre Progreso con el rango "Año", esas dos sesiones fantasma solas ya
sacan ~30 días de "tiempo entrenado".

### Dos causas distintas, dos arreglos distintos

**Causa A — rutina borrada con la sesión abierta** (las dos de `bener`).
`src/app/entrenar/[sessionId]/page.tsx` ya detecta esto (`!session.routineId`)
y cierra la sesión con lo que tiene — pero sella `finishedAt` con `new Date()`,
o sea la hora de quien la visite, sin importar cuánto tiempo lleve huérfana.
En las dos sesiones de `bener` la "última serie" es igual (o casi igual) al
inicio: no hubo actividad real después, todo el resto es tiempo muerto.

**Causa B — "Empezar" reanuda una sesión abierta de días atrás, no una de
verdad abandonada.** `findOpenSession()` (en `src/app/entrenar/actions.ts`)
busca la sesión abierta más reciente de esa rutina **sin mirar la fecha**. Si
entrenas el lunes, no le das "Terminar entrenamiento", y el jueves vuelves a
tocar "Empezar" en la misma rutina, la app **reabre la sesión del lunes** en
vez de crear una nueva — y cuando por fin la terminas, la duración abarca los
cuatro días de por medio. Las tres sesiones de `karizmendi` y `erika` de la
tabla son justo esto: series reales, repartidas en días distintos, todas
metidas en la misma fila de `workout_sessions`. Esta es la causa dominante (3
de 5 casos) y la más fácil de que vuelva a pasar — no depende de borrar nada,
sólo de no tocar "Terminar" el mismo día.

### Lo que se va a hacer

- **Regla de "mismo día" al reanudar.** `findOpenSession` (o quien lo llama)
  compara `localDate(open.startedAt)` contra `localDate(new Date())` (mismo
  helper que ya usa toda la app para "Hoy toca" y las rachas). Si la sesión
  abierta es de un día anterior, se trata como abandonada: se cierra sola
  (ver el punto siguiente) y se crea una sesión nueva de verdad. Si es de
  hoy, se reanuda igual que ahora. Esto también hay que aplicarlo donde el
  botón "Continuar" del Home lleva directo a `/entrenar/[sessionId]`, no sólo
  en `startSession`: la página del entrenamiento es quien de verdad decide si
  una sesión sigue viva.
- **Sellar `finishedAt` con la última actividad real, no con `now()`.** Tanto
  para la causa A (rutina borrada) como para la nueva regla de "mismo día":
  el cierre automático usa `max(set_logs.logged_at)` de esa sesión, o
  `startedAt` si no tiene ni una serie registrada. Sin esto, la regla del
  punto anterior arregla la causa B hacia adelante pero seguiría dejando
  duraciones de horas de más en cada cierre automático.
- **Corregir las 5 filas ya dañadas** con el mismo criterio (SQL a mano
  contra Neon, como todo lo demás del proyecto): para cada una,
  `finished_at` pasa a ser la última `logged_at` de sus `set_logs`, o
  `started_at` si no tiene ninguna serie.
- **Red de seguridad en los agregados.** Aunque las dos reglas de arriba
  cierren el problema hacia adelante, `getPeriodStats` y `getSessionSummaries`
  van a acotar la duración de una sesión a un máximo razonable (a definir —
  algo como 6 horas) antes de sumarla, para que una sesión que se cuele por
  cualquier otra vía nunca vuelva a desbalancear un promedio o un total ella
  sola.

**Lo que NO se va a hacer**: hoy el sistema no tiene forma de saber cuánto
tiempo estuviste *activamente* entrenando dentro de una sesión larga (contar
sólo los huecos entre series menores a cierto minutaje, al estilo "tiempo en
movimiento" de Strava). Eso resolvería el caso de `karizmendi` (12 series
reales en 4 días, probablemente unas pocas horas de entrenamiento real) con
precisión, pero es una función bastante más grande. Con las reglas de arriba
ese caso deja de *producirse* hacia adelante; no hace falta la versión
sofisticada todavía.

**Cómo se sabrá que quedó**: las 5 sesiones de la tabla muestran una duración
creíble (minutos u horas, no días); entrenar un lunes, no terminar, y volver
el jueves a "Empezar" la misma rutina crea una sesión nueva (la del lunes
queda cerrada sola con su propia duración corta); y `npm run smoke` sigue en
9/9.

**Hecho (2026-09-22)**: `isSameLocalDay` (`src/lib/dates.ts`) y
`closeAbandonedSession` (`src/db/queries.ts`, sella con `max(set_logs.logged_at)`
o `started_at`) se usan en `startSession` (`src/app/entrenar/actions.ts`) y en
`EntrenarPage` (`src/app/entrenar/[sessionId]/page.tsx`, que es quien decide
si una sesión sigue viva sin importar por dónde se llegue). Las 5 filas de la
tabla ya se corrigieron a mano contra Neon con el mismo criterio (verificado
antes y después de escribir). `getPeriodStats` y `getSessionSummaries` acotan
cada sesión a `MAX_SESSION_MINUTES` (6 h) al sumarla. `npm run build`, `npx
eslint src` y `npm run smoke` (9/9) en verde.

---

## 2. 1RM estimado por ejercicio

**Lo que hay hoy.** "Peso máx." en la página de un ejercicio guarda el peso
más alto que se haya registrado, sin mirar las reps: 60 kg × 3 le gana a
55 kg × 10 aunque lo segundo sea, para casi cualquier lectura de fuerza, el
dato más fuerte.

**Lo que se va a hacer.** Agregar "1RM est." como métrica alterna en la
gráfica del ejercicio (`ExerciseProgressChart`), calculada con la fórmula de
Epley (`peso × (1 + reps / 30)`) sobre la mejor serie de cada sesión. Es el
mismo cálculo que usan Strong y Hevy. No requiere columnas nuevas: sale de
`set_logs` igual que "Peso máx." hoy. Sólo aplica a ejercicios con peso (no a
placas, por la misma razón de siempre: no hay forma honesta de convertir
placas a un número de fuerza comparable).

**Cómo se sabrá que quedó**: la gráfica de un ejercicio con peso tiene un
botón más ("1RM est.") junto a "Peso máx.", y el número calculado coincide a
mano con la fórmula para un par de series de muestra.

**Hecho (2026-09-22)**: nuevo campo `est1RM` en `ExerciseProgressChart` y en
`progreso/[exerciseId]/page.tsx` (mejor 1RM de Epley entre las series con peso
de cada sesión). Probado a mano en el navegador: una serie de 55 kg × 10 dio
73.3, más alto que 60 kg × 5 (70) — justo el caso que "Peso máx." no ve.

---

## 3. Cobertura muscular

**Lo que hay hoy.** Los datos reales de esta semana muestran a las dos
usuarias activas entrenando casi puro tren inferior en máquina (sentadilla
hack en trineo, extensión de pierna, abducción de cadera, curl femoral). No
hay nada en la app que avise de un desbalance — la información ya existe
(`exercises.body_part` + `set_logs` + `workout_sessions`), sólo no se muestra
agrupada así.

**Lo que se va a hacer.** Una tarjeta en Progreso (debajo del calendario de
constancia, antes de "Por ejercicio") con los grupos musculares del catálogo
(`src/lib/body-parts.ts` ya tiene la lista) y hace cuántos días se entrenó
cada uno por última vez, ordenados del más olvidado al más reciente. Sin
columnas nuevas.

**Cómo se sabrá que quedó**: la tarjeta existe y, contra los datos reales de
hoy, "espalda" (o el grupo que de verdad no se ha tocado) aparece arriba con
más días que "piernas".

**Hecho (2026-09-22)**: `getMuscleCoverage` (`src/db/queries.ts`) recorre
`BODY_PARTS` y cruza contra el último `set_logs.logged_at` por `body_part`;
los grupos nunca entrenados van primero. Verificado contra los datos reales:
en la cuenta de `erika gordillo`, "espalda" sale con 5 días mientras
"piernas" (tren superior/inferior de pierna) sale con 0.

---

## 4. Tendencia de frecuencia, no sólo de carga

**Lo que hay hoy.** La tarjeta grande de Progreso lleva la tendencia de
*carga* (`tendenciaDeCarga`, % contra el periodo anterior). Mirando semana a
semana: Erika pasó de 6 → 4 → 1 sesión; Karla de 5 → 1 → 1. Alguien que
entrena una vez a la semana con el mismo peso de siempre puede ver "0 %, vas
igual" en la carga, mientras la frecuencia real se está cayendo — la tarjeta
no lo dice porque no es lo que mide.

**Lo que se va a hacer.** Un segundo indicador, chico, junto a la tendencia de
carga: sesiones de esta semana contra el promedio de las últimas 4. Ya existe
casi todo el dato (`getPeriodStats` cuenta sesiones por periodo); falta la
comparación semana-a-semana en vez de periodo-completo-contra-periodo-anterior.

**Cómo se sabrá que quedó**: con los datos reales de hoy, la cuenta de
`karizmendi` o `erika` muestra la caída de frecuencia aunque su carga se vea
plana.

**Hecho (2026-09-22)**: `getFrequencyTrend` (`src/db/queries.ts`) — semana
actual contra el promedio de las 4 anteriores, siempre semana-a-semana, no
depende del selector de rango. Se muestra junto a la tendencia de carga en
la tarjeta grande con `TrendPill`. Verificado contra datos reales:
`karizmendi@grupoargue.com` da -33 % y `erika gordillo` -60 % de frecuencia
en una semana donde `getPeriodStats(7)` no muestra caída de carga (o no hay
con qué comparar) — es justo la señal que la tendencia de carga no daba.

---

## 5. Decidir si el selector de rango filtra toda la pantalla

**Lo que hay hoy.** El selector Semana/Mes/Año de arriba de Progreso sólo
cambia la tarjeta de tendencia y los 4 tiles. El calendario de constancia
(fijo a 14 semanas), "Por ejercicio" (récords de toda la vida) y "Sesiones"
(las últimas 30, sin importar el rango) no se mueven con el selector.

**No es necesariamente un bug** — un récord es, por definición, de toda la
vida — pero hoy es así por cómo se fue construyendo cada pieza, no porque se
haya decidido a propósito. Vale la pena decidirlo una vez y dejarlo escrito
aquí, en vez de que quede ambiguo.

**Opciones:**
- **A. Dejarlo como está**, documentando que el selector es sólo para la
  tendencia y los totales; "Por ejercicio" y "Sesiones" son vistas de "toda
  la vida" / "recientes" a propósito.
- **B. Que "Sesiones" respete el rango elegido** (fácil: ya se filtra por
  fecha en `getSessionSummaries`, sólo falta pasarle el corte del rango en
  vez de un límite fijo de 30). "Por ejercicio" seguiría siendo de toda la
  vida siempre, porque un récord filtrado por rango deja de ser un récord.

**Cómo se sabrá que quedó**: la decisión (A o B) queda escrita aquí con fecha,
y si es B, cambiar a "Semana" de verdad acorta la lista de sesiones.

**Decisión (2026-09-22): B.** "Sesiones" ahora respeta el rango elegido
arriba: `getSessionSummaries` recibe `{ days, limit }` y filtra por
`started_at >= now - days` (con `limit: 200` como tope de filas, no de
tiempo, para el rango "Año"). "Por ejercicio" sigue siendo de toda la vida
siempre, sin cambios — un récord filtrado por rango deja de ser un récord.
Probado a mano: cambiar a "Semana" en una cuenta con sesiones de varias
semanas deja la lista con sólo las de los últimos 7 días.
