# El programa de rutinas de FiTME

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

### Jueves — Espalda y Hombro *(nueva)*

1. Jalón al pecho con barra pro lat en polea — 2×8 *(de Erika)*
2. Remo sentado agarre cerrado en máquina — 2×8 *(de Erika)*
3. Press de hombro v. 3 en máquina — 2×8
4. Jalón al pecho brazo recto en polea — 2×10 *(con barra, brazos extendidos)*
5. Remo para deltoides posterior de pie en polea con cuerda (face pull) — 2×12 *(de Karla)*
6. Encogimiento de hombros en polea — 2×12 *(de Erika)*
7. Curl en banco Scott en máquina — 2×10 *(Erika: ver §3)*
8. Extensión de tríceps por encima de la cabeza en polea — 2×10 *(de Karla)*

Descartados a propósito de las rutinas de espalda de ellas: el remo invertido
(peso corporal), el remo a una mano en Smith (incómodo, y el remo en máquina
cubre lo mismo) y el remo sentado en polea de Karla (duplicaba el remo en
máquina). Hubo dos cambios después del primer armado: se **quitó** la
elevación lateral en máquina (ya está la de polea el lunes), y el jalón a una
mano se cambió por el **jalón con brazos rectos** a dos manos.

### Viernes — Pierna — Femoral y Glúteo *(nueva)*

Pensada como complemento del martes, no como repetición: ningún ejercicio se
repite entre los dos días.

1. Prensa de pierna a 45° en trineo — 2×10 *(de Karla; pies altos en la plataforma para cargar glúteo y femoral)*
2. Curl femoral acostado en máquina — 2×10 *(de Karla; el martes es sentado)*
3. Pull-through en polea con cuerda — 2×12 *(bisagra de cadera: femoral y glúteo)*
4. Sentadilla péndulo — 2×10 *(ejercicio propio, ver §4)*
5. Aducción de cadera sentado en máquina — 2×12 *(el martes es abducción)*
6. Extensión de pierna en máquina — 2×12 *(de Erika)*
7. Elevación de talones en prensa de pierna sentado en máquina — 2×15 *(de Karla; el martes es sentado)*

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
