# Siguiente ronda (acordada 2026-09-22)

Estado: **6 de 7 hechos**; sólo queda el respaldo de gifs, bloqueado en una
decisión de Vercel. El orden de abajo es el de ataque.
Cada punto tiene lo que hay hoy, qué se va a hacer y cómo se sabrá que quedó.

Documento vivo: conforme se suba cada punto se marca aquí y se agrega su fila
al registro de cambios de [PLAN.md](./PLAN.md), como manda
[la convención](./README.md#convenciones).

## Decisiones ya tomadas

| Pregunta | Respuesta |
|---|---|
| ¿Qué significa "la app va en español e inglés"? | **Interfaz completa bilingüe con selector** en Perfil, igual que el tema. No solo el contenido del catálogo. |
| ¿Cómo se traducen las 1,500 instrucciones? | **Las traduzco yo**, por lotes, sin pagar API de traducción ni meter otra llave al proyecto. |

## Orden de ataque

1. [x] Descanso: que sobreviva y que suene — **hecho**
2. [x] Instrucciones de ejercicio en español — **hecho: los 1,500**
3. [x] App bilingüe con selector de idioma — **hecho**
4. [x] Recordatorio de "hoy toca" — **hecho**
5. [x] Aviso de récord en el momento — **hecho**
6. [x] Migraciones versionadas — **hecho**
7. [ ] Respaldo de gifs *(bloqueado: necesita una decisión tuya en Vercel)*

---

## 1. Descanso: que sobreviva y que suene

**Lo que hay hoy.** El cronómetro de descanso vive en estado de React
(`SessionHud.tsx`, `useState<number | null>(null)`). Dos consecuencias medidas:

- Si sales de la pantalla del entrenamiento —a ver otra rutina, a Progreso, o
  porque iOS descarta la pestaña— vuelves y **el descanso desapareció**.
- Al terminar solo vibra (`navigator.vibrate(200)`). Con el teléfono en la
  banca y tú haciendo otra cosa, no te enteras.

**Lo que se va a hacer.**

- **Persistir el descanso** guardando *el instante en que termina*, no los
  segundos que faltan. Se escribe en `localStorage` con la clave de la sesión;
  al montar el HUD se lee y se recalcula contra el reloj. Así aguanta salir de
  la pantalla, recargar y que el sistema descarte la pestaña, y no se desfasa
  si el navegador congela los temporizadores en segundo plano.
- **Sonido al terminar**: **tres pitidos cortos y seguidos**. Se generan con la
  Web Audio API (un oscilador), sin archivo de audio que descargar ni cachear:
  ~880 Hz, 120 ms cada uno, 90 ms de silencio entre ellos. Dura menos de un
  segundo en total.
- **Interruptor en Perfil** para apagarlo, junto al de apariencia. Se guarda
  por dispositivo, igual que el tema.
- La vibración se queda como está, en paralelo al sonido.

**El detalle que hay que hacer bien.** iOS no deja que una página emita sonido
si no hubo un gesto del usuario antes. El gesto existe —marcar la serie con el
✓ es lo que arranca el descanso—, así que el `AudioContext` se crea y se
desbloquea **en ese toque**, no cuando el temporizador llega a cero. Si se hace
al final, iOS lo bloquea y no suena nunca.

**Límite honesto que no resuelve este punto.** Si bloqueas el teléfono o te
sales de la app, iOS suspende la página: no va a sonar. Para ese caso hace
falta una notificación local del sistema, que es el punto 4. Aquí se cubre el
caso real y más común: el teléfono desbloqueado con la app abierta.

**Hecho** (2026-09-22). Comprobado en navegador, 7 de 7:

- el descanso arranca al marcar la serie y queda guardado en `localStorage`;
- sigue corriendo tras salir a Progreso y volver (02:59 → 02:53, o sea que
  descuenta el tiempo que estuviste fuera en vez de reiniciarse);
- sobrevive a recargar la página;
- al llegar a cero se crean **exactamente 3 osciladores** (los tres pitidos),
  el HUD vuelve a "Entrenando" y la clave de `localStorage` se limpia.

Un hallazgo del camino: **al recargar se pierde el permiso de audio** y el
descanso habría terminado en silencio. Se resolvió volviendo a desbloquearlo
con cualquier toque en la pantalla — basta con que mires el teléfono. Lo que
sigue sin poderse: con el teléfono bloqueado o la app cerrada iOS suspende la
página y no suena. Eso es el punto 4.

---

## 2. Instrucciones de ejercicio en español

**Lo que hay hoy.** Los 1,500 ejercicios del catálogo tienen instrucciones y
**los 1,500 están en inglés**: `"Step:1 Hang from a pull-up bar with your arms
fully extended and your palms facing away from you…"`. Los nombres sí se
tradujeron en su momento (`exercises.name_es`), las instrucciones nunca. Es el
pendiente más viejo del proyecto: viene desde la fase 2.

**Lo que se va a hacer.**

- Columna nueva `exercises.instructions_es` (migración aditiva, mismo
  procedimiento de siempre: SQL a mano y `db:push` para verificar que no queda
  diferencia).
- **Yo traduzco los 1,500**, en lotes paralelos, escribiendo directo a la base.
  Sin servicio externo ni llave nueva en el proyecto.
- La traducción respeta la jerga de gimnasio en español de México: *dominadas*,
  *sentadilla*, *peso muerto*, *polea*, *mancuerna*, *empuja con los talones*.
  Nada de traducción literal tipo "conduce por tus talones".
- Se conserva el formato de pasos (`Step:1`, `Step:2`…) para no romper el
  parseo que ya hace la hoja de "cómo se hace".
- El inglés original **no se borra**: queda en `instructions` y se muestra
  cuando la app esté en inglés (punto 3).

**Orden de traducción**: primero los ejercicios que están en alguna rutina (hoy
39), para que el cambio se vea el mismo día; luego el resto del catálogo.

**Cómo se valida**: revisión a mano de una muestra de 20 traducciones, y una
comprobación automática de que ningún ejercicio quedó con `instructions_es`
vacío o con más/menos pasos que el original.

**Hecho** (2026-09-22): **los 1,500 ejercicios del catálogo están traducidos**.
Se hizo en tres tandas —39 en uso, 1,225 del catálogo, 236 rezagados— y las
1,500 pasaron la misma validación: mismo número de pasos que el original, sin
inglés residual, sin faltantes ni duplicados. Cero rechazadas.

Cómo quedó montado:

- Columna `exercises.instructions_es` (migración aditiva) y
  `src/db/exercise-instructions.ts` con `coalesce(instructions_es,
  instructions)` — mismo patrón que `exerciseGif`, así ninguna pantalla tiene
  que acordarse de elegir idioma. Las tres consultas que leían `instructions`
  ahora leen ese helper, y la interfaz no cambió ni una línea.
- Validación antes de escribir a la base: mismo número de pasos que el
  original, sin inglés residual, sin faltantes ni duplicados. Las 39 pasaron.
- Comprobado en la app: la hoja de "cómo se hace" muestra 7 pasos, todos en
  español ("Ajusta la máquina a tu cuerpo y elige el peso que vas a usar").

---

## 3. App bilingüe con selector de idioma

**Lo que hay hoy.** Todos los textos están escritos a mano, en español, dentro
de cada componente: `"Empezar entrenamiento"`, `"Series"`, `"Descartar"`,
`"Todavía no tienes rutinas…"`. Son ~400 textos repartidos en unas 25
pantallas.

**Lo que se va a hacer.**

- **Sacar todos los textos a un diccionario**: `src/i18n/es.ts` y
  `src/i18n/en.ts`, con las mismas claves. TypeScript obliga a que el inglés
  tenga exactamente las mismas claves que el español, así que no se puede
  olvidar ninguna sin que truene el build.
- **Selector en Perfil → Idioma** (Español / English), igual que el de
  apariencia.
- **El idioma viaja en una cookie, no en `localStorage`.** Es la decisión de
  arquitectura importante: casi toda esta app son componentes de servidor, así
  que el servidor tiene que saber el idioma **antes** de renderizar. Con
  `localStorage` la página llegaría en español y cambiaría a inglés al
  hidratar — un parpadeo en cada carga. Con cookie llega bien de una vez.
- **Sin prefijos de ruta** (`/es/rutinas`, `/en/rutinas`). Cambiarían todas las
  URLs, romperían los enlaces guardados y obligarían a rehacer el cache del
  service worker. La cookie basta.
- **El contenido del catálogo sigue al idioma**: en español se muestra
  `name_es` + `instructions_es`; en inglés, `name` + `instructions`. Eso lo
  deja listo el punto 2.

**Lo que NO cambia con el idioma.** El día y la semana se siguen calculando en
`America/Mexico_City` — el idioma es del usuario, la zona horaria es del
gimnasio. Poner la app en inglés no debe mover "Hoy toca" ni la semana de los
anillos.

**Trampa conocida**: `tests/smoke.mjs` busca textos en español (`"Crear
rutina"`, `"Empezar entrenamiento"`). La suite tiene que fijar el idioma a
español con la cookie, o se va a caer en cuanto exista el inglés.

**Hecho** (2026-09-22). Comprobado recorriendo Hoy, Rutinas, detalle de rutina,
Progreso, detalle de sesión y Perfil en los dos idiomas, con un detector de
palabras que sólo existen en español: **cero fugas** en inglés, y `<html lang>`
cambia con el idioma. `npm run smoke` sigue en 9/9 (se le fijó la cookie a
español, como estaba previsto).

Tres cosas que salieron al hacerlo y que vale la pena tener escritas:

1. **El diccionario no puede cruzar la frontera servidor→cliente.** Los textos
   con números y plurales son funciones, y React no serializa funciones: la app
   tiraba 500 en cuanto una pantalla las pasaba a un componente de cliente. Lo
   que cruza ahora es **sólo el idioma** (un string); cada lado importa el
   diccionario de `src/i18n/dicts.ts`, que no toca `next/headers` y por eso
   puede vivir en los dos mundos.
2. **Las fechas y los números también cambian de idioma, la zona horaria no.**
   `fmtDate`, `weekRangeLabel`, `fmtNumber` y `fmtKg` reciben el locale;
   `America/Mexico_City` se queda fija, porque es la del gimnasio y no la del
   usuario. El rango de semana usa `Intl.formatRange`, que sabe que en español
   es "21–27 de septiembre" y en inglés "September 21 – 27"; armarlo a mano
   daba "21 – September 27".
3. **`daysAgoLabel` se eliminó**: devolvía "Nunca / Hoy / Ayer / Hace N días" en
   español duro y ya nadie lo llamaba.
4. **Dos fugas de verdad, encontradas después** (al construir el punto 5, no en
   la verificación original): `loadLabel()` (la etiqueta "3 placas" de un
   récord) y tres llamadas a `bodyPartLabel()` en Progreso seguían fijas en
   español porque esas dos funciones son de `src/lib/`, fuera de las carpetas
   que se le repartieron a los agentes de la conversión. La verificación
   original no las cachó porque su cuenta de prueba no tenía ningún récord en
   placas. Se movió `loadLabel` a `src/lib/load-label.ts` (recibe el
   diccionario, ya no lo adivina) y se les pasó `t` a los `bodyPartLabel` que
   les faltaba. **Lección**: verificar un idioma nuevo con una cuenta que
   ejercite TODAS las variantes de datos (placas, no sólo kg), no sólo las
   pantallas.

Lo que **no** cambia de idioma, a propósito: los nombres de rutina (los
escribes tú) y los de ejercicio (vienen del catálogo, que ya tiene columna en
cada idioma).

---

## 4. Recordatorio de "hoy toca"

**Por qué.** De tus 20 sesiones terminadas, **12 empezaron a las 8 de la
noche**. Hoy "Hoy toca" solo existe si abres la app, o sea que sirve cuando ya
te acordaste.

**Hecho** (2026-09-22). No existe forma de programar una notificación local en
web —Notification Triggers nunca salió de experimental—, así que el aviso lo
manda el servidor: suscripción push por dispositivo (tabla
`push_subscriptions`) más un cron en Vercel que corre a las **19:00 de Ciudad
de México** y avisa a quien tenga rutina ese día.

**El plan gratuito de Vercel sólo permite crons diarios**, y lo descubrí de la
peor forma: puse uno cada hora y Vercel **rechazó el deploy entero**, en
silencio — el push a `main` no generó ninguna corrida y la app se quedó como
estaba. Por eso la hora del aviso es fija y no se puede elegir; la columna
`reminder_hour` se conserva para el día que el plan permita un cron por hora.

Verificado contra producción, 8 de 8: el interruptor guarda la suscripción, el
cron selecciona a quien tiene rutina hoy, no repite el aviso el mismo día,
rechaza peticiones sin `CRON_SECRET`, y no borra la suscripción cuando el fallo
del servicio de push es pasajero (sólo cuando la declara expirada).

**Lo que no se puede verificar de forma automática**: el handshake real con el
servicio de push de Chrome. Playwright corre en contextos de incógnito y Chrome
no soporta la Push API ahí. La prueba sustituye `pushManager.subscribe` por uno
falso, así que comprueba **nuestro** código de punta a punta, no el del
navegador. Eso hay que probarlo a mano en el teléfono. De paso, ese intento
destapó un fallo real y ya arreglado: si `subscribe` falla, el interruptor se
quedaba muerto y sin explicación.

---

## 5. Aviso de récord en el momento

**Hecho** (2026-09-22). Sin pantallas nuevas, como se planeó.

- Al marcar una serie, `logSet` consulta el récord del ejercicio **antes** de
  guardar (así compara contra "lo que había justo antes de este cambio", lo
  cual también resuelve editar una serie ya guardada sin lógica aparte) y
  devuelve si la serie que se acaba de guardar lo supera. **Sólo cuenta si ya
  había una marca previa que superar**: la primera vez que haces un ejercicio
  no es "un récord roto", es el primer dato — no se celebra.
- La fila lo celebra con una insignia de trofeo sobre el botón de ✓ (color
  `load`, el mismo que usa Progreso para los récords) y una vibración distinta
  a la del ✓ normal. La insignia se limpia sola si luego editas esa serie a un
  valor que ya no es récord.
- El resumen post-entrenamiento (`?done=1`) agrega una tarjeta "Récords de
  esta sesión" que lista, por ejercicio, si la marca histórica que tiene
  ahora mismo salió de una serie **de esta sesión** — no una bandera guardada
  al vuelo que se desactualizaría si editas o borras esa serie después.
- El cálculo del "¿es récord?" se factorizó a una sola función
  (`recordScore` en `src/db/queries.ts`), usada tanto por `getPersonalRecords`
  como por `logSet`: antes había dos copias de la lógica de puntaje y hubiera
  sido fácil que un día dijeran cosas distintas.

**Encontrado al hacerlo, y arreglado**: construir esto obligó a mostrarle al
usuario la etiqueta de un récord en placas ("7 placas"), y ahí apareció una
fuga real de la app bilingüe — ver el punto 4 de la lista de arriba en la
sección 3. No estaba en el plan original de este punto; salió de probar con
un ejercicio de placas, que la verificación de la app bilingüe no había
cubierto.

Probado en navegador: la primera serie de un ejercicio nuevo no se celebra;
subir el peso sobre la marca anterior sí; bajarlo no; lo mismo funciona con
placas; el resumen final lista los dos récords rotos en la sesión con su
carga correcta.

---

## 6. Migraciones versionadas

**Hecho** (2026-09-22).

El problema no era generar la primera migración — es que la base **ya tenía**
las 9 tablas, aplicadas a mano durante nueve rondas. Correr esa migración de
verdad habría intentado crearlas de nuevo y tronado contra la primera línea.
El procedimiento fue **adoptar** el historial, no ejecutarlo:

1. `npx drizzle-kit generate` sobre el `schema.ts` de hoy → una sola migración
   (`drizzle/0000_clever_nocturne.sql`) que reconstruye las 9 tablas completas.
2. Antes de nada, se verificaron las 9 tablas contra `information_schema.tables`
   — si hubiera faltado una, no se podía asumir que ya estaba aplicada.
3. Se creó a mano `drizzle.__drizzle_migrations` (el esquema y la tabla que usa
   el migrador de Drizzle) y se insertó la fila que esa migración habría
   dejado si hubiera corrido de verdad: mismo `hash` (sha256 del `.sql`
   completo, tal como lo calcula `drizzle-orm`) y mismo `created_at` (el
   `when` de `drizzle/meta/_journal.json`).
4. Verificado con las dos formas de aplicar migraciones que existen en el
   proyecto — `drizzle-kit migrate` (CLI) y `migrate()` de
   `drizzle-orm/neon-http` (programático) — y las dos terminan sin error y
   sin tocar ninguna tabla: reconocen la 0000 como ya aplicada. `db:push` se
   corrió después y confirmó, una vez más, cero diferencias.

**De aquí en adelante**, un cambio de esquema es: editar `schema.ts` →
`npm run db:generate` (queda la migración en `drizzle/`) → `npm run db:migrate`
(se aplica) → commit. El caso de "tabla con datos, sin TTY" (donde `db:push`
pide confirmación interactiva y truena en un agente) sigue existiendo — ahí el
orden es SQL a mano → `db:generate` para que quede registrada → adoptarla con
el mismo procedimiento de arriba, en vez de dejarla fuera del historial.

**De regalo, en el mismo repaso de la documentación**: `src/app/manifest.ts`
seguía con el lavanda del diseño anterior (`#ebe7fb`) en vez del negro del
rediseño — la PWA instalada destellaba lavanda un instante antes de pintar el
lienzo real. Ya dice `#000000`.

---

## 7. Respaldo de gifs — bloqueado

Diagnosticado a fondo (ver notas de infra en [PLAN.md](./PLAN.md)): el token de
Blob llega vacío al runtime y además el store es privado, así que no sirve URLs
públicas. **Necesita una decisión tuya en el panel de Vercel** antes de que yo
pueda hacer nada: crear un store público y conectarlo, o quedarnos con el
privado y que yo escriba una ruta que sirva los gifs con el token.

Mientras tanto la app funciona: los gifs se sirven del servidor externo. El
riesgo es quedarse sin imágenes si ese servidor se cae.

---

## Lo que NO entra en esta ronda

- **Peso corporal**: la función existe y tiene **0 registros** en la base.
  Antes de agregarle fotos o medidas, habría que decidir si se esconde.
- **Compartir rutina por link, premios, plantillas**: son features de "app para
  muchos" y hoy son tres usuarios.
- **Comprar arte de mayor resolución** para los gifs (gym-animations.com, $599)
  — sigue siendo la única forma real de que se vean mejor, pero es dinero y va
  aparte.
