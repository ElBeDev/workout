# Siguiente ronda (acordada 2026-09-22)

Estado: **plan acordado, sin empezar**. El orden de abajo es el de ataque.
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
2. [ ] Instrucciones de ejercicio en español
3. [ ] App bilingüe con selector de idioma
4. [ ] Recordatorio de "hoy toca"
5. [ ] Aviso de récord en el momento
6. [ ] Migraciones versionadas
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

**Hecho cuando**: abres "cómo se hace" de cualquier ejercicio de tus rutinas y
los pasos están en español correcto. Esfuerzo: es el punto más largo, pero es
proceso, no dificultad.

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

**Hecho cuando**: cambias a English en Perfil, recorres las siete pantallas y
no queda un solo texto en español; vuelves a Español y todo regresa. Y
`npm run smoke` sigue en 9/9. Esfuerzo: es el punto más grande de la ronda.

---

## 4. Recordatorio de "hoy toca"

**Por qué.** De tus 20 sesiones terminadas, **12 empezaron a las 8 de la
noche**. Hoy "Hoy toca" solo existe si abres la app, o sea que sirve cuando ya
te acordaste.

**Lo que se va a hacer.** Notificación local ("hoy toca Pierna") a una hora que
tú elijas, los días que la rutina tenga asignados. Requiere permiso del sistema
y que la app esté **instalada como PWA** — en iPhone las notificaciones web
solo funcionan si la agregaste a la pantalla de inicio (iOS 16.4 en adelante).
Se pide el permiso desde Perfil, nunca al entrar.

**Hecho cuando**: llega el aviso a la hora configurada un día que toca rutina.

---

## 5. Aviso de récord en el momento

**Lo que hay hoy.** El récord por ejercicio ya se calcula
(`getPersonalRecords`) y se ve en Progreso. Cuando lo rompes —el único momento
en que importa— la app no dice nada.

**Lo que se va a hacer.** Al marcar una serie que supera tu mejor marca de ese
ejercicio, la fila lo celebra en el momento y el resumen al terminar lista los
récords de la sesión. Sin pantallas nuevas.

---

## 6. Migraciones versionadas

**Lo que hay hoy.** Las nueve migraciones se han aplicado con SQL a mano contra
Neon. `schema.ts` es la fuente de verdad, pero **nada en el repo prueba que
producción coincide con él**; el día que dejen de coincidir te enteras en
producción.

**Lo que se va a hacer.** `drizzle-kit generate` una vez, commitear la carpeta
`drizzle/`, y de ahí en adelante toda migración pasa por ahí.

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
