# Panel del coach y Retos (Decimocuarta, 2026-09-24)

Estado: **hecho en local, sin subir** (ver el registro de cambios de
[PLAN.md](./PLAN.md) cuando se suba). La migración `drizzle/0002_massive_reptil.sql`
**ya está aplicada en Neon** (es aditiva: dos tablas nuevas y dos columnas con
default; el código que está en producción no la nota).

Salió de la pregunta "¿qué le falta para estar a la altura de las grandes?". De
la lista se eligieron dos cosas que Strong o Hevy no pueden copiar porque FiTME
es la app **de un gimnasio**, no una app suelta:

1. [x] **Panel del coach**: ver el progreso de cada socio, quién no ha venido
   en 10 días, y dejarle comentarios.
2. [x] **Retos y ranking del gimnasio**: tonelaje, asistencia, series o metros
   de la semana o del mes, más retos con fechas y meta que arma el coach.

---

## 1. Panel del coach (`/admin`)

El coach es cualquier cuenta con `users.is_admin`. El panel de admin deja de
ser "elige a alguien para armarle rutinas" y pasa a ser el seguimiento:

- **Lista de socios en dos bloques**: arriba, en rojo, *"Sin venir hace 10
  días o más"* (`INACTIVE_DAYS` en `src/db/gym.ts`), del que más días lleva al
  que menos, y al final los que **nunca han entrenado** (al primero hay que ir
  a buscarlo, al segundo arrancarlo; suele salir con "sin rutinas", porque un
  usuario nuevo nace vacío). Abajo, *Activos*. Cada fila: última vez y "N días
  · N series en 30 días".
- **"Última vez" es la última serie o bloque de natación marcado**, no la
  última sesión: hay sesiones vacías (abiertas y terminadas sin nada) que
  harían creer que alguien vino.
- **Ficha del socio** (`/admin/usuarios/[userId]`): sus anillos de la semana con
  *sus* metas, "Últimos 30 días" (sesiones, series, carga, tiempo y la
  tendencia de frecuencia), músculos que entrenaba y lleva 14+ días sin tocar
  (los que nunca ha tocado se omiten: cuello o cardio serían ruido),
  comentarios, sesiones recientes y sus rutinas (lo de antes, abajo).
- **Sesión del socio vista por el coach**
  (`/admin/usuarios/[userId]/sesion/[sessionId]`): las mismas series que ve el
  socio, **sólo lectura** (son suyas; corregirlas sigue siendo cosa del socio),
  sus notas y el hilo de comentarios de esa sesión. El armado de las series
  salió a `getSessionExerciseGroups` en `queries.ts` y lo usan las dos
  pantallas.

### Comentarios

Tabla `coach_comments` (`user_id` = socio, `author_id` = coach con SET NULL,
`session_id` opcional con CASCADE, `read_at`).

- **El socio los ve en Hoy** ("De tu coach"), con liga a la sesión si es sobre
  una, hasta que pulsa **Entendido** (marca todos como leídos). Los de una
  sesión se quedan además para siempre en el detalle de esa sesión.
- **Push**: al comentar se manda una notificación con `after()` (no bloquea la
  respuesta; si falla, el comentario ya quedó). Va en español por la misma
  razón que el recordatorio: el idioma vive en una cookie del teléfono.
- El coach ve "Leído / Sin leer" y puede borrar lo que escribió.

## 2. Retos (`/retos`, quinta pestaña)

- **Ranking** de la **semana** (lunes a domingo) o del **mes** calendario, en
  hora de México, por **días** (la métrica por omisión: es en la que cualquiera
  puede ganar, levante lo que levante), **carga**, **series** o **natación**
  (metros). Empates comparten lugar (1, 1, 3); quien va en cero no sale.
- **Retos** que arma el coach en `/admin/retos`: nombre, métrica, fechas
  (inclusive, días locales guardados como `date`) y meta por persona
  opcional. Activos arriba con tu barra de progreso, "N de M lo lograron",
  podio de 3 y tu lugar si quedas fuera; luego próximos; terminados (30 días)
  con su ganador.
- **Participa todo el que aparece en el ranking**; no hay "unirse". Con los
  socios que hay hoy, un paso extra sólo quitaba gente.
- **Nada se guarda**: todo se calcula de `set_logs` y `swim_block_logs` con los
  mismos criterios que los anillos (cuentan las series de la sesión abierta;
  **las placas no suman carga**; un día cuenta si tuvo una serie o un bloque de
  natación). Así editar o borrar una serie corrige el ranking solo.

### Privacidad

- Una de las cuentas es un correo (`karizmendi@grupoargue.com`). El ranking
  **nunca muestra el usuario completo**: muestra `users.display_name` (nuevo,
  se elige en Perfil → "Retos y ranking") o, si no hay, el usuario hasta la
  "@". No se reusó `users.name`: es heredada y la de bener dice "Owner".
- `users.show_in_ranking` (default `true`): apagado, sigues viendo retos y
  ranking pero nadie ve tus números, y Retos te lo avisa.
- El smoke test crea su cuenta con `show_in_ranking = false` para no asomarse
  en la tabla real cuando corre contra producción.

## Cómo se verificó

- `tsc`, `eslint src tests` y `npm run build` limpios.
- Recorrido con Playwright contra el build local (que apunta a la base de
  producción) con una **cuenta QA desechable** que no toca a ningún socio
  real: panel, crear reto desde el formulario, comentario suelto y de sesión
  (a la propia cuenta QA, para no mandarle push a nadie), ficha y sesión de un
  socio real **sólo en lectura**, tarjeta en Hoy, comentario en el detalle,
  aviso de oculto, nombre y visibilidad desde Perfil, reto y ranking con "tú",
  "Entendido" (comprobado por `read_at` en la base). Capturas en claro y
  oscuro. Cuenta y reto borrados al final.
- `npm run smoke` con la prueba nueva de Retos: 10/10 dos veces seguidas.
  Antes, dos corridas dieron 7/9 y 8/9 por "add exercise" / "log a set";
  corriendo `main` sin estos cambios también sale 8/9 en una de tres, así que
  es intermitencia previa del smoke (ver el pendiente en PLAN.md §9).

## Lo que queda abierto

- Los comentarios sueltos, una vez "Entendido", el socio ya no los vuelve a
  ver en ningún lado (los de sesión sí). Si se extrañan: una lista en Perfil.
- Un reto en Hoy ("vas 5/12 días") ayudaría a que se vea sin abrir la pestaña.
- El socio no puede contestar el comentario; es de una vía a propósito por
  ahora.
- Carga en placas: un socio que entrena sobre todo en placas queda abajo en el
  ranking de carga. Es la misma decisión de siempre (no hay conversión honesta);
  por eso la métrica por omisión es días, y la pantalla lo dice bajo la tabla.
