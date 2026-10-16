# El programa de rutinas de GainLine

> Estado (2026-09-23): **las 4 cuentas que existen tienen las mismas 5
> rutinas**, con una sola excepción por usuaria (§3). Esto es **contenido,
> no código**: vive en la base (`routines`, `routine_exercises`,
> `swim_blocks`), se editó con scripts contra Neon y no hay commit que lo
> contenga. Este documento es el único registro de qué hay, por qué y cómo
> se aplicó.

## 0. Contexto

El dueño (`bener`, admin) arma las rutinas de todos. El 2026-09-23 se
reorganizó la semana completa en una sola sesión de trabajo: se armó una
rutina nueva de espalda y hombro con ejercicios que ya usaban Karla y Erika,
se separó la pierna en dos días distintos, se borró la rutina de "Tirón"
porque ya no aportaba nada, y al final se copió todo a todas las cuentas.

Importa saber que **`.env.local` apunta a la base de producción** (lo
comprueba que las sesiones de Karla y Erika, que sólo entran por la app
publicada, están ahí). Todo cambio de rutina hecho desde un script local
se ve en https://workout-eight-neon.vercel.app al recargar, sin deploy.

## 1. La semana

| Día | Rutina | `routines.kind` |
|---|---|---|
| Lunes | Tren Superior — Empuje | fuerza |
| Martes | Pierna y Glúteo | fuerza |
| Miércoles | Natación | natacion |
| Jueves | Espalda y Hombro | fuerza |
| Viernes | Pierna — Femoral y Glúteo | fuerza |

Todas las de fuerza van a **2 series** por ejercicio, sin peso objetivo
(`target_weight` en null: cada quien lo registra la primera vez) y en `kg`.
Los nombres de abajo son los que muestra la app (`name_es`) desde el arreglo
de traducciones del 2026-09-23 (§6), para que se encuentren tal cual al
buscarlos.

### Lunes — Tren Superior — Empuje

1. Press de pecho en máquina — 2×6
2. Press de hombro v. 3 en máquina — 2×6
3. Press de pecho inclinado en máquina — 2×8
4. Apertura sentado en máquina — 2×12
5. Elevación lateral a una mano en polea — 2×12
6. Extensión de tríceps con barra V en polea — 2×10
7. Curl en polea — 2×10 *(agregado el 2026-09-23; venía de la rutina de Erika)*

### Martes — Pierna y Glúteo

1. Sentadilla hack en trineo — 2×6
2. Curl femoral sentado en máquina — 2×10
3. Extensión de cadera v. 2 en máquina — 2×10
4. Abducción de cadera sentado en máquina — 2×12
5. Prensa de pantorrilla sentado en máquina — 2×12
6. Crunch sentado en máquina — 2×15
7. Crunch de rodillas en polea — 2×15

Antes estaba en martes **y** jueves; el jueves pasó a espalda y hombro.

### Miércoles — Natación

Calentamiento 1×400 m libre · principal 8×100 m libre, descanso 15 s ·
patada 4×50 m, descanso 20 s · enfriamiento 1×200 m libre, suave. Es la misma
rutina de bloques que se repartió el 2026-09-22 (ver
[natacion.md §5.1](./natacion.md)); aquí sólo se le cambió el nombre a la de
Karla de "Alberca" a "Natación".

### Miércoles — Complementarias — Abdomen *(2026-10-14)*

Segunda rutina del miércoles, debajo de Natación (`sort_order` 3 contra 2).
El 2026-10-14 el dueño pidió que fuera de abdomen: "una chingona de abdomen,
no muchos ejercicios, y le metes máquinas también". Quedó en cinco
ejercicios a 3 series (no 2, para que pocos ejercicios rindan), y el nombre
pasó de "Core y Estabilidad" a "Abdomen".

1. Elevación de piernas en silla romana — 3×12 *(`captains chair straight leg raise`: antebrazos en las almohadillas; abdomen bajo)*
2. Rueda abdominal — 3×10 *(`wheel rollerout`, de rodillas; pronto en la rutina para cuidar la espalda baja)*
3. Abdominales en banco declinado con peso — 3×12 *(`weighted decline sit-up`, con disco al pecho o detrás de la cabeza)*
4. Crunch sentado en máquina — 3×15 *(la misma máquina del martes: es la única de abdomen que hay)*
5. Giro de torso en polea (leñador) — 3×12 por lado *(de arriba hacia abajo)*
6. Elevación diagonal en polea (leñador inverso) — 3×12 por lado *(de abajo hacia arriba)*
7. Plancha frontal — 3×45 s *(`hold`, se registra en segundos)*

**Excepción a la regla de sólo máquinas**: la silla romana y la plancha son
de peso corporal. No hay nada para abdomen bajo en máquina o polea: no hay
máquina de elevación de piernas, el crunch inverso en polea necesita tobillera
y el dueño no quiere crunch en polea. El "máquinas también" del pedido se
leyó como mezcla, y el dueño lo confirmó al pedir él mismo la silla romana.

Ese mismo día se ajustó una vez: la elevación de piernas colgado pasó a la
silla romana ("la donde se recargan los codos"), y la flexión lateral en
polea salió por el leñador inverso ("la que se jala la polea hacia arriba"),
para que el leñador vaya en los dos sentidos y de los dos lados. El `name_es`
de la silla romana ("captains elevación pierna recta en silla") se corrigió a
mano.

Luego el dueño pidió "otras 2 más así pesadas" y entraron la rueda abdominal y
los abdominales declinados con peso, con lo que quedó en siete. Los `name_es`
de las dos ("rollerout con rueda", "abdominales declinado con peso") se
corrigieron a mano. Al paso 2 de las instrucciones del declinado se le agregó
dónde va el disco, porque el texto original no lo decía. Plan B si no hay
rueda en el gimnasio: elevación oblicua de rodillas en la silla romana
(`hanging oblique knee raise`).

Salieron de Core y Estabilidad la rotación externa de hombro, la apertura
inversa, la flexión lateral, la extensión de espalda, la pantorrilla en Smith
y el curl de muñeca. Karla (`karizmendi@grupoargue.com`) ya había recortado la
suya a cuatro (los dos leñadores, flexión lateral y apertura inversa); se
igualó con las demás. Respaldo de las filas de antes en el scratchpad de esa
sesión, no en el repo.

#### Antes: Core y Estabilidad *(2026-09-30 → 2026-10-13)*

1. Rotación externa de hombro de pie en polea — 2×12 *(manguito: press y natación)*
2. Apertura inversa cruzada alta de pie en polea — 2×12 *(escápula; el face pull del jueves es parecido)*
3. Elevación diagonal en polea (leñador inverso) — 2×12 *(de abajo hacia arriba)*
4. Giro de torso en polea (leñador) — 2×12 *(de arriba hacia abajo)*
5. Flexión lateral en polea — 2×12 por lado *(oblicuos)*
6. Crunch sentado en máquina — 2×15
7. Extensión de espalda en máquina — 2×12 *(lumbar)*
8. Elevación de talones de pie en Smith — 2×15 *(de pie; martes y viernes son sentado y en prensa)*
9. Curl de muñeca en polea — 2×15 *(antebrazo y agarre para jalones y remos)*

Los `name_es` de estos ejercicios se corrigieron a mano ese día.

Llegó así en tres pasos, el mismo día: (1) casi todo estiramiento, con dos
rodillos y siete estiramientos más la rotación externa; (2) al dueño le gustó
la rotación externa y pidió más de ese estilo, entraron rotación interna,
apertura inversa y leñador; (3) pidió quitar lo que quedaba de estiramiento y
la rotación interna, y entraron los otros seis; (4) tres de esos se cambiaron por variantes: el
crunch inverso en polea por elevación de piernas en máquina (el dueño no quiere
crunch en polea), la pantorrilla a una pierna y el agarre por versiones que no
necesitan tobillera ni correa; (5) la pantorrilla de pie pasó a Smith y la
elevación de piernas al crunch sentado del martes, porque **el gimnasio no
tiene ni la máquina de pantorrilla de pie ni la de elevación de piernas**. **En el gimnasio no hay tobilleras ni cinturones
para amarrarse a las poleas**: nada que las requiera. Descartados por redundantes
o fuera de regla: aducción en polea (viernes), hiperextensión inversa (ya está
la extensión de espalda), patada de glúteo en polea (se rechazó el viernes),
Pallof y Y (sólo existen con banda en el catálogo).

### Jueves — Espalda y Hombro *(nueva)*

1. Jalón al pecho con barra pro lat en polea — 2×8 *(de Erika)*
2. Remo sentado agarre cerrado en máquina — 2×8 *(de Erika)*
3. Press de hombro v. 3 en máquina — 2×8
4. Jalón al pecho brazo recto en polea — 2×10 *(con barra, brazos extendidos)*
5. Remo para deltoides posterior de pie en polea con cuerda (face pull) — 2×12 *(de Karla)*
6. Encogimiento de hombros en polea — 2×12 *(de Erika)*
7. Curl en banco Scott en máquina — 2×10 *(Erika: ver §3)*
8. Extensión de tríceps en máquina — 2×10 *(2026-10-07: sentado, empujando dos palancas hacia abajo; reemplazó a la extensión por encima de la cabeza en polea, de Karla, que al dueño no le gustó. No confundir con los fondos sentado en máquina, que se pusieron primero por error)*

Descartados a propósito de las rutinas de espalda de ellas: el remo invertido
(peso corporal), el remo a una mano en Smith (incómodo, y el remo en máquina
cubre lo mismo) y el remo sentado en polea de Karla (duplicaba el remo en
máquina). Hubo dos cambios después del primer armado: se **quitó** la
elevación lateral en máquina (ya está la de polea el lunes), y el jalón a una
mano se cambió por el **jalón con brazos rectos** a dos manos.

### Viernes — Pierna — Femoral y Glúteo *(nueva)*

Pensada como complemento del martes. Desde el 2026-10-15 repite un ejercicio
con él, el curl femoral sentado, porque el dueño lo pidió así.

1. Prensa de pierna a 45° en trineo — 2×10 *(de Karla; pies altos en la plataforma para cargar glúteo y femoral)*
2. Curl femoral sentado en máquina — 2×10 *(el mismo del martes, a pedido del dueño)*
3. Peso muerto rumano en máquina — 2×10 *(`leverage machine romanian deadlift`, fila agregada a mano al catálogo: bisagra de cadera, femoral y glúteo)*
4. Sentadilla péndulo — 2×10 *(ejercicio propio, ver §4)*
5. Aducción de cadera sentado en máquina — 2×12 *(el martes es abducción)*
6. Extensión de pierna en máquina — 2×12 *(de Erika)*
7. Elevación de talones en máquina hack, de frente — 2×15 *(`hack calf raise`: en la máquina de sentadilla hack, volteado hacia el respaldo)*

**Cambios del 2026-10-15** (en las 3 cuentas que la comparten, sobre las
mismas filas, así que el historial no se desliga): el curl femoral acostado
pasó a sentado; el pull-through en polea salió porque el dueño no lo quiere en
polea, y entró la hiperextensión inversa en máquina (la patada de glúteo en
máquina, `lever hip extension v. 2`, ya está el martes); y la elevación de
talones pasó de la prensa a la máquina hack. Se corrigieron a mano los
`name_es` de los dos nuevos ("inverso hiperextensión en máquina" y "hack
elevación de talones").

El mismo día, al dueño no le gustó la hiperextensión inversa y pidió **peso
muerto rumano en máquina** ("Leverage Machine RDL"). El catálogo de ExerciseDB
no lo trae (sólo `lever deadlift`, que es convencional, y el de Smith), así que
se agregó a mano una fila `leverage machine romanian deadlift` / "Peso muerto
rumano en máquina" (`upper legs`, `leverage machine`, instrucciones en los dos
idiomas, sin gif y sin `external_id`, así que el seed no la toca), igual que la
`front plank`. Entró en la posición 3 a 2×10.

La posición 4 pasó por dos intentos antes de quedar: patada de glúteo en polea
(el dueño no quiso polea ahí) → sentadilla búlgara en Smith (tampoco) →
sentadilla péndulo.

## 2. Reglas que puso el dueño (para no volver a preguntarlas)

- **Sólo máquinas**: palanca, polea o trineo. Nada de barra, mancuernas ni
  peso corporal. La Smith quedó fuera en la práctica: las dos veces que se
  propuso, se cambió.
- **Bíceps y tríceps siempre el mismo día, uno de cada uno.** Nunca dos
  ejercicios de bíceps en una sesión. Hoy: lunes y jueves, con ejercicios
  distintos cada día (4 series de cada uno a la semana).
- **Nada redundante entre rutinas.** Por eso se borró "Tren Superior — Tirón"
  (antes el viernes): remo, jalón, dominada, deltoides posterior y dos curls,
  todo ya cubierto por Espalda y Hombro, y dos de ellos con peso libre. No
  tenía una sola sesión registrada, así que borrarla no tocó historial.
- La única repetición aceptada es el **press de hombro v. 3** (lunes 2×6,
  jueves 2×8). Si algún día carga de más el deltoides anterior, el primer
  cambio sugerido es cambiar el del jueves por apertura inversa en máquina.

## 3. Excepción por usuaria

**Erika** (`erika gordillo`): en el jueves tiene **curl agarre cerrado en
polea** (de pie, barra corta V o EZ) en lugar del curl en banco Scott,
porque el cojín del Scott le lastima el pecho. Es la única diferencia entre
las 4 cuentas. **Si se vuelven a sincronizar las rutinas, hay que
respetarla** (volver a aplicarla después de copiar).

## 4. Cómo se aplicó a todas las cuentas

Cuentas: `bener`, `erika gordillo`, `karizmendi@grupoargue.com` y
`karlaarizmendi` (probablemente la misma Karla con dos cuentas; ver
PLAN.md §9.10; se le copió todo igual mientras se decide).

- **No se borró ninguna rutina de las usuarias.** Para cada día se tomó la
  rutina que ya tenían asignada ese día y se **actualizó en su lugar**
  (nombre, días, orden, y se reemplazaron sus `routine_exercises`); sólo se
  insertó una rutina nueva donde no había nada ese día. Así
  `workout_sessions.routine_id` sigue apuntando a una rutina que existe.
  Borrar y recrear habría dejado esas sesiones como "Rutina eliminada".
- **Costo conocido**: las sesiones viejas ahora se ven con el nombre nuevo.
  Ejemplo: las 2 sesiones de Erika en "Gluteos/Biceps" aparecen como "Pierna
  — Femoral y Glúteo", aunque los ejercicios registrados en ellas no cambian
  (`set_logs` apunta a ejercicios, no a la rutina). Récords, 1RM y gráficas
  por ejercicio no se ven afectados.
- **Ejercicios propios**: la sentadilla péndulo no existe en el catálogo
  (se buscó "pendul" en `name` y `name_es`), así que se creó como ejercicio
  propio (`is_custom = true`, `leverage machine`, `upper legs`, con
  instrucciones en español en formato `Step:N`). Cada cuenta tiene **su
  propia copia** en vez de apuntar a la del dueño, igual que si la hubiera
  creado desde la app.
- **Sin imagen**: ninguna de las 4 copias tiene foto. Se intentó subir un gif
  y el Blob lo rechazó porque el store es privado (ver PLAN.md, pendiente #1).
  Cuando exista un store público, se sube una vez y se pone el mismo
  `gif_blob_url` en las 4 filas.
- Todo se corrió en una sola transacción de `neon().transaction([...])`, y
  al final se verificó que las 4 cuentas tuvieran exactamente las mismas
  rutinas (nombre, días, ejercicios con series×reps, bloques de natación).

### Para repetirlo (usuario nuevo, o volver a sincronizar)

Un usuario que se registra hoy **empieza sin rutinas**: no hay plantillas
(PLAN.md §9.6). Para dárselas, el procedimiento es el de arriba con
`bener` como fuente: emparejar por día y `kind`, actualizar en su lugar,
insertar lo que falte, copiar los ejercicios propios a la cuenta destino
(reusando la copia si ya existe por `name`) y abortar si la cuenta destino
tiene dos rutinas el mismo día o una rutina en un día que la fuente no
cubre (en lugar de adivinar). Después, volver a aplicar la excepción de §3.

## 5. Cronología del 2026-09-23

1. Nueva "Espalda y Hombro" para `bener` en jueves; "Pierna y Glúteo" deja
   el jueves.
2. El viernes pasa a pierna; "Tirón" se queda sin día y se le pasa el curl
   Scott a Espalda y Hombro.
3. Se quita la elevación lateral en máquina y el jalón a una mano se cambia
   por el de brazos rectos.
4. Se borra "Tren Superior — Tirón" (0 sesiones).
5. Bíceps y tríceps juntos: curl en polea al lunes, extensión por encima de
   la cabeza al jueves.
6. Nueva "Pierna — Femoral y Glúteo" para el viernes; el martes se queda con
   la original.
7. La patada en polea → búlgara en Smith → sentadilla péndulo (ejercicio
   propio).
8. Copia a Erika y Karla (`karizmendi@…`), y después a `karlaarizmendi`.
9. Excepción del curl para Erika.

## 6. Lo que quedó abierto

- **Foto de la sentadilla péndulo**: bloqueada por el Blob privado.
- ~~**Nombres mal traducidos del catálogo**~~ ✅ (2026-09-23). "45в° prensa
  de pierna en trineo" ahora es "prensa de pierna a 45° en trineo" y "tirón
  through" es "pull-through". De paso se corrigieron el resto de los
  nombres en uso que sonaban mal ("tríceps extensión de tríceps (v-bar)",
  "cadera abducción", "alto pulley…", "agarre remo sentado cerrado"…): 61
  nombres del catálogo cambiaron, arreglando las reglas del traductor, no
  la base a mano (ver la nota de `name_es` en PLAN.md).
- **Cuenta duplicada de Karla** (`karlaarizmendi`): ya tiene todo copiado,
  pero sigue pendiente decidir si se borra.
- **Usuarios nuevos arrancan vacíos**: hoy se les copia a mano. Las
  plantillas de PLAN.md §9.6 lo resolverían.

## 7. Ejercicios por tiempo: estiramientos, isométricos y cardio

`exercises.measure` tiene cuatro valores (`src/lib/measure.ts`):

| Valor | Qué es | Se registra | ¿Suma series, ranking de series y cobertura? | ¿Carga y récords? |
|---|---|---|---|---|
| `reps` | Lo normal | Repeticiones y carga | Sí | Sí |
| `seconds` | Estiramientos y rodillo | Segundos, sin carga | **No**: estirar el femoral no es haberlo entrenado. Sólo cuenta el día | No |
| `hold` | Isométricos (plancha, L-sit, front lever…) y cardio corto en intervalos | Segundos, sin carga | **Sí**: una plancha sí es entrenar el abdomen | No |
| `minutes` | Cardio: caminadora, bici, elíptica, escaladora, correr, cuerda | **Minutos**, sin carga | **Sí** | No |

En los tres por tiempo, `set_logs.reps` guarda el tiempo: minutos en
`minutes`, segundos en los otros dos. La app los muestra como "2 × 30 s" o
"1 × 20 min", sin campo de carga, sin sugerencia y sin el descanso de 3
minutos. En el CSV salen en la columna `segundos`, no en `reps` (el cardio
se pasa de minutos a segundos ahí).

**`seconds`** (2026-09, migración 0003): los 63 del catálogo cuyo nombre en
inglés tiene *stretch* (menos `dynamic …` y `weighted stretch lunge`, que
son movimiento). Ninguna rutina los usa hoy (Complementarias empezó con
estiramientos y se quedaron fuera).

**`hold`** (2026-10-13, Decimoquinta): se agregó porque la plancha se estaba
registrando como si fuera de peso. `reberodriguez` tenía "weighted front
plank" en "Tren superior 2" y la anotaba con peso 0 y "repeticiones" de 20 y
40, que en realidad eran segundos. Al pasarla a `hold`, esas series quedaron
bien sin tocarlas: ya eran segundos. Sólo se limpió el peso 0, que pasó a
vacío. Hay 14 del catálogo en `hold`, elegidos a mano porque son
sostenidos y no movimiento:

- Planchas: `weighted front plank`, `bodyweight incline side plank`,
  `power point plank`, `side bridge v. 2`, y la `front plank` nueva (abajo).
- Calistenia: `front lever`, `back lever`, `l-sit on floor`, `v-sit on floor`,
  `frog planche`, `full planche`, `lean planche`, `straddle planche`,
  `handstand`.
- `isometric chest squeeze`.

Se quedaron en `reps` las variantes con movimiento, aunque digan *plank* o
*isometric*: `front plank with twist`, `plank tap shoulder`, `push-up to side
plank`, `reverse plank with leg lift`, `side plank hip adduction`,
`isometric wipers` y `front lever reps`. También el `farmers walk` y los
*carry*, porque ahí lo que progresa es la carga.

El catálogo de ExerciseDB **no traía la plancha básica**, sólo la que lleva
disco en la espalda. Se agregó a mano una fila `front plank` / "Plancha
frontal" (`waist`, peso corporal, `hold`, sin gif y sin `external_id`, así
que el seed no la toca). Desde el 2026-10-14 es la primera `hold` del
programa compartido: cierra Complementarias — Abdomen, 3×45 s.

**`minutes`** (2026-10-15): el cardio estaba en `reps`, con campo de
peso, y no tenía sentido. Los criterios, aplicados a todo `body_part =
'cardio'` (33) más dos máquinas de cardio que el catálogo tenía en otra
parte:

- **`minutes`** (15), cardio continuo: caminadora, bicis (`stationary bike
  run/walk`, `cycle cross trainer`, `hands bike`), las tres elípticas,
  `walking on stepmill`, `ski ergometer`, `run`, `run (equipment)`,
  `short stride run`, `wheel run` y `jump rope`.
- **`hold`** (20), cardio en intervalos cortos, que se anota "30 s" y no
  cabe en minutos enteros: mountain climber, jacks, star/scissor/astride
  jumps, skater hops, bear crawl, burpees, `high knee against wall`,
  `ski step`, `push to run`, `swing 360`, `semi squat jump`, `half knee
  bends` y `walking high knees lunge`.

`reberodriguez` tenía `run (equipment)` en "Tren inferior 1" (1×10, peso 0)
y lo había anotado una vez con 18 "repeticiones" y peso 0: eran minutos.
Como con la plancha, al pasarlo a `minutes` quedó bien sin tocar la serie;
sólo se limpió el peso 0, en la serie y en el objetivo.

En la misma auditoría pasaron a **`seconds`** tres posturas de yoga que no
tenían *stretch* en el nombre: `butterfly yoga pose`, `reclining big toe
pose with rope` y `seated wide angle pose sequence`. Lo demás del catálogo
ya era coherente: los que dicen *bridge*, *hold* o *static* son movimiento
con repeticiones, y `air bike` y `wind sprints` son ejercicios de abdomen
aunque suenen a cardio.

Un ejercicio propio se puede crear por tiempo desde la app: el formulario
de "Crear ejercicio" tiene "Cómo se registra" (repeticiones y peso, o
tiempo). Hay dos opciones por tiempo: segundos (`hold`) y minutos
(`minutes`, para cardio); desde la app no se puede crear un estiramiento
(`seconds`), porque no contaría para nada.
