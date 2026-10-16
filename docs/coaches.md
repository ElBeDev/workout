# Decimoséptima: GainLine para coaches

Estado: **en curso.** Pasos 1 a 3 de 7 hechos (2026-10-15).
 Es la parte técnica de
[negocio.md](./negocio.md) (qué se vende, a quién y a cuánto): aquí está cómo se
construye sobre el código de hoy, en qué orden y cómo se sabe que quedó.

Por ahora todo sigue en Vercel y en la web. Pero **la app de iOS y Android ya
viene** (fase 5 de negocio.md), así que todo lo de esta ronda se arma para
que la app nativa lo use sin rehacerlo (§2).

---

## 1. De dónde partimos

Hoy la app es **de un solo gimnasio con un solo coach**:

| Pieza | Cómo está hoy | Problema para coaches |
|---|---|---|
| Coach | `users.is_admin`; `requireAdmin()` en `src/lib/admin.ts` | Un admin ve **a todo el mundo** |
| Panel del coach | `/admin`, `getMemberStatuses()` en `src/db/gym.ts` | Lee **todos** los usuarios (`from(users)` sin filtro) |
| Ranking | `getActivity()` en `src/db/gym.ts` | Todos contra todos |
| XP y rangos | `getTimelines()` en `src/db/timelines.ts` | Arma la línea de tiempo **de todas las cuentas** en cada página. Con 7 usuarios no se nota; con 500 coaches no aguanta |
| Retos | `challenges`, uno para todos | Un coach vería los retos de otro |
| Rutinas de otro | `isAdminUser()` en `rutinas/[id]` | Cualquier admin edita las rutinas de cualquiera |
| Foto y tarjeta de socio | `api/avatar/[userId]`, `retos/socio/[userId]` | Se ven con sólo estar en el ranking global |
| Registro | `registro/actions.ts`: usuario y contraseña | No hay tipo de cuenta ni coach |
| Sesión | Token en la tabla `sessions`, cookie `session` | Sirve tal cual para la app (§2.3) |

Lo que **sí sirve sin cambios**: el catálogo, rutinas, entrenamiento,
progreso, natación, comentarios del coach (`coach_comments` ya tiene
`author_id`), el push, el CSV y la foto en la base.

---

## 2. Reglas de arquitectura (para que la app nativa no rehaga nada)

### 2.1 La lógica vive en servicios, no en las pantallas

Hoy la regla de negocio está dentro de las server actions (`"use server"`) y de
las páginas. Una app nativa no puede llamar server actions. A partir de esta
ronda:

- **`src/server/`**: funciones normales de TypeScript, una carpeta por tema
  (`coaches.ts`, `vinculos.ts`, `cobro.ts`, `acceso.ts`…). Reciben **quién lo
  pide** (`actorId`) como primer argumento, validan con zod y devuelven datos o
  un error tipado. No leen cookies ni hacen `redirect`.
- **Las server actions quedan delgadas**: sacan el usuario de la sesión, llaman
  al servicio y deciden a dónde redirigir.
- En la fase 5, **`/api/v1/...` llama a los mismos servicios**. La app nativa y
  la web hacen exactamente lo mismo, con los mismos permisos.

Lo de esta ronda se escribe así desde el principio. Lo viejo (rutinas,
entrenar, progreso) se mueve a servicios cuando se haga la API, no antes.

### 2.2 Los permisos en un solo lugar

`src/server/acceso.ts` responde las preguntas que hoy están regadas como
`isAdminUser()`:

- `puedeVerSocio(viewerId, socioId)`: es él mismo, es su coach activo, o es
  el dueño de la plataforma.
- `puedeEditarRutina(viewerId, rutina)`: es suya o es el coach activo del dueño
  de la rutina.
- `grupoDe(userId)`: los ids con los que compite (§5).
- `requireCoach()`: es coach y su plan no está bloqueado (§7).

Ninguna página decide permisos por su cuenta. Así la API de la fase 5 hereda
las mismas reglas.

### 2.3 La sesión ya sirve para la app

`sessions.token` es un token opaco con caducidad. La app nativa lo va a mandar
como `Authorization: Bearer <token>` en lugar de cookie. En esta ronda sólo se
deja `getCurrentUserId()` listo para leer cualquiera de los dos; la app lo usa
en la fase 5.

### 2.4 Los cobros no dependen de la pantalla

El estado del plan lo escribe **el webhook de Stripe** en la base. La web y la
app sólo leen ese estado. Nada se activa porque alguien llegó a una página de
"gracias".

---

## 3. Modelo de datos (migración 0005)

Todo aditivo: columnas con default y tablas nuevas. El código en producción no
lo nota, igual que las migraciones anteriores.

### 3.1 `users`

- `role text not null default 'member'`: `'member'` | `'coach'`.
- `is_admin` cambia de significado: deja de ser "el coach" y pasa a ser **el
  dueño de la plataforma** (sólo `bener`), que ve a todos los coaches (§8).

### 3.2 `coaches` (nueva): perfil, marca y plan

| Columna | Qué |
|---|---|
| `user_id` (PK, FK users, cascade) | El coach |
| `code` (único) | Código para invitar, `GL-7K3P`: 4 caracteres sin 0/O ni 1/I |
| `brand_name` | Nombre que ven sus alumnos (fase de marca) |
| `accent_color` | Color de su marca (fase de marca) |
| `in_ranking` | Si el coach compite en el ranking y los retos de su grupo. Por omisión no; `bener` sí (migración 0006) |
| `plan` | `'coach'` (hasta 30) / `'coach_plus'` (sin tope) / `'comp'` (gratis, para `bener`) |
| `billing_status` | `'trialing'` / `'active'` / `'past_due'` / `'locked'` / `'canceled'` |
| `trial_ends_at`, `current_period_end` | Fechas del plan |
| `past_due_since` | Para los 7 días de gracia |
| `stripe_customer_id`, `stripe_subscription_id` | Stripe |
| `created_at` | |

El logo del coach irá en `coach_logos` (misma idea que `user_avatars`: bytea
en la base, no en Blob). Se agrega en el paso 7, no antes: hasta entonces no
hay quién lo suba.

### 3.3 `coach_clients` (nueva): el vínculo

| Columna | Qué |
|---|---|
| `id` | |
| `coach_id`, `client_id` (FK users, cascade) | |
| `status` | `'pending'` (pidió el alumno) / `'active'` / `'ended'` |
| `source` | `'link'` / `'code'` / `'request'` / `'migration'` |
| `created_at`, `accepted_at`, `ended_at` | |
| `ended_by` | Quién lo terminó |

- **Índice único parcial**: un solo vínculo `pending` o `active` por alumno
  (`where status in ('pending','active')`). Un coach a la vez, garantizado por
  la base, igual que el índice de "una sesión abierta por rutina".
- Los vínculos `ended` se quedan como historial: sirven para saber quién fue
  coach de quién.
- Un coach no se puede ligar a sí mismo.

### 3.4 Columnas en lo que ya existe

- `routines.created_by` (FK users, set null): quién armó la rutina. Si no es el
  dueño, se muestra "De tu coach". Las de hoy quedan en null.
- `challenges.coach_id` (FK users, cascade): de qué grupo es el reto. Los retos
  de hoy pasan a `bener`.

### 3.5 `stripe_events` (nueva)

`id` (el id del evento de Stripe, PK) y `received_at`. Stripe puede mandar el
mismo evento dos veces: si ya está, se ignora.

---

## 4. Alumno y coach: cómo se conectan

### 4.1 Registro e inicio de sesión

- **`/login`**: igual que hoy, sin preguntar el tipo. Abajo, dos ligas:
  *"Crear cuenta para entrenar"* (`/registro`) y *"Soy coach"*
  (`/registro/coach`).
- **`/registro`**: igual que hoy. Crea un `member`.
- **`/registro/coach`**: usuario, contraseña, nombre visible y nombre de su
  marca. Crea el `user` con `role = 'coach'` y su fila en `coaches` con
  `billing_status = 'trialing'`. En la fase de cobro (§7) de ahí pasa a la
  tarjeta antes de entrar.
- **Un alumno puede volverse coach** desde Perfil ("Soy coach"), sin crear otra
  cuenta: conserva su historial y entra al mismo flujo de alta y tarjeta.

### 4.2 Invitación por liga o QR (el camino principal)

- Liga: **`/unirse/GL-7K3P`**. Muestra el nombre y la foto o logo del coach y
  dos botones: *Crear cuenta* y *Ya tengo cuenta*.
- El código viaja por el registro o el login en una cookie corta
  (`invitacion`, 1 hora). Al terminar se crea el vínculo **activo de una vez**:
  si el coach compartió su liga, ya aceptó.
- Si el alumno ya tenía coach: *"Ya entrenas con X. ¿Cambiar a Y?"*. Si
  confirma, se termina el vínculo viejo y se crea el nuevo.
- Si el coach ya llegó a su tope de alumnos: no se liga, y el alumno ve
  *"Tu coach llegó al límite de su plan; avísale"*. Al coach le llega un push.
- **QR**: la misma liga en un QR que el coach descarga o enseña en pantalla
  (paquete `qrcode`, genera SVG del lado del servidor).
- **Compartir**: botón con el mensaje listo para WhatsApp (`wa.me/?text=`).

### 4.3 Con código o buscando al coach

En **Perfil → "Mi coach"**:

- Sin coach: campo para el código (mismo efecto que la liga) o búsqueda por
  nombre de usuario del coach, que crea un vínculo `pending`. El coach lo ve en
  **Solicitudes** y acepta o rechaza; al alumno le llega un push con la
  respuesta.
- Con coach: su nombre y foto, desde cuándo, y **"Dejar a mi coach"** (pide
  confirmación).

### 4.4 Qué pasa al desligarse

- El coach deja de ver al alumno al momento (permisos de §2.2).
- El alumno conserva todo: historial, XP, rutinas (las de su coach se quedan
  marcadas "De tu coach").
- Lo puede hacer cualquiera de los dos. Al otro le llega un push.

---

## 5. Grupo: ranking, retos, XP y fotos

**El grupo** de alguien es el de su coach activo: los alumnos activos de ese
coach, más el coach **sólo si compite** (`coaches.in_ranking`). Un coach ve el
ranking de su propio grupo. Un alumno sin coach no tiene grupo.

**Los coaches no compiten por omisión**: son el coach, no un alumno más. El
dueño lo pidió así para todos menos para él: `bener` tiene `in_ranking`
encendido y sale en el ranking de sus alumnos (2026-10-15). Más adelante se
puede volver un interruptor en el panel del coach.

- **Ranking**: `getActivity()` recibe la lista de ids del grupo en lugar de
  leer a todos.
- **XP y rangos**: `getTimelines()` también. Esto además **arregla el
  rendimiento**: hoy cada página arma la línea de tiempo de toda la base.
- **Retos**: los del `coach_id` del grupo. Un alumno sin coach no ve retos.
- **Medallas de retos**: cuentan los retos de todos los coaches que la persona
  ha tenido (y los suyos, si es coach), para que cambiar de coach no le quite
  medallas.
- **Alumno sin coach en Retos**: en lugar de un ranking de uno solo, una
  tarjeta *"Entrena con tu coach"* con el campo del código.
- **Foto, tarjeta de socio y nombre**: se ven dentro del mismo grupo
  (`api/avatar`, `retos/socio`). Quien eligió "salir del ranking" sigue
  oculto para los demás alumnos, pero no para su coach.

---

## 6. El panel del coach

**`/coach`** (el `/admin` de hoy, con permisos por coach). `/admin` queda
para el dueño (§8).

| Sección | Qué | Estado |
|---|---|---|
| **Alumnos** | Lo de hoy (quién no viene, activos, ficha, sesiones, comentarios), sólo con sus alumnos | Se adapta |
| **Invitar** | Código, liga, QR y botón de WhatsApp. "N de 30 alumnos" | Nuevo |
| **Solicitudes** | Los `pending`, con aceptar y rechazar | Nuevo |
| **Rutinas** | Armar rutinas a un alumno (hoy ya existe) y **copiar una rutina a varios alumnos** (hoy se hace a mano, ver rutinas.md) | Se adapta + nuevo |
| **Retos** | Lo de `/admin/retos`, para su grupo | Se adapta |
| **Mi marca** | Logo, nombre y color | Fase de marca |
| **Mi plan** | Plan, alumnos usados, tarjeta y facturas (portal de Stripe) | Fase de cobro |

Un coach también entrena: sigue teniendo Hoy, Rutinas, Progreso y lo demás
como cualquier alumno.

---

## 7. Cobro con Stripe

- **Productos en Stripe**, en pesos y con IVA incluido: Coach $199 al mes y
  $1,990 al año; Coach con más de 30 alumnos $399 al mes.
- **Alta**: `/registro/coach` → Stripe Checkout (modo suscripción, 14 días de
  prueba, **tarjeta obligatoria**) → de regreso a `/coach`. El estado lo
  escribe el webhook, no la página de regreso (§2.4).
- **Webhook** `/api/stripe/webhook`: valida la firma, ignora eventos
  repetidos (`stripe_events`) y actualiza `coaches` con
  `customer.subscription.created/updated/deleted`, `invoice.paid` e
  `invoice.payment_failed`.
- **Si falla un cobro**: `past_due`, aviso arriba del panel y 7 días de gracia
  (`past_due_since`). Después, `locked`: `requireCoach()` manda a una página de
  *"Actualiza tu pago"* con la liga al portal. **Los alumnos siguen
  entrenando** con lo que tienen; sólo se bloquea el panel.
- **Tope de alumnos**: en el plan Coach, el alumno 31 no se liga (§4.2). El
  panel ofrece subir a $399.
- **Portal de Stripe** para cambiar tarjeta, ver facturas, cambiar de plan o
  cancelar. No se construye nada de eso a mano.
- **`bener`** queda en plan `comp`: gratis, sin Stripe.
- **Variables**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y los ids de
  precio, en Vercel. Se prueba en modo de pruebas de Stripe antes de cobrar de
  verdad.

---

## 8. El panel del dueño (`/admin`)

Sólo `is_admin` (tú): la lista de coaches con plan, estado, alumnos, fecha de
alta y último cobro; cuántos pagan y cuánto entra al mes. Sirve para ver de un
vistazo quién no está pagando. El mantenimiento de gifs que hoy vive en
`/admin` se queda ahí.

---

## 9. Los datos de hoy

En la misma migración, con un script revisado antes de correrlo:

- `bener`: `role = 'coach'`, fila en `coaches` con plan `comp`, su código.
  Sigue con `is_admin`.
- Los otros 6 (`karizmendi@grupoargue.com`, `culona69`, `reberodriguez`,
  `andicicero`, `chely`, `jeanalyne`): vínculo `active` con `bener`, `source =
  'migration'`.
- Los retos de hoy: `coach_id = bener`.
- **Para ellos no cambia nada**: mismo ranking (son el mismo grupo), mismos
  retos, mismo coach.

---

## 10. Orden de trabajo

Cada paso es un commit que se sube y se prueba en producción antes del
siguiente. Ninguno deja la app a medias para los usuarios de hoy.

1. [x] **Esquema y datos** (§3, §9). Migración `drizzle/0005_smart_saracen.sql`
   (aditiva) aplicada en Neon el 2026-10-15. Datos: `bener` es coach con plan
   `comp` y código **`GL-27DE`**; los otros 6 quedaron como sus alumnos
   (`source = 'migration'`). No había retos que pasarle. Comprobado que la
   base rechaza un segundo vínculo abierto para el mismo alumno. Sin cambios
   visibles: smoke 11/11.
2. [x] **Permisos** (§2.2). `src/server/acceso.ts` y las guardias
   `requireCoach` / `requireCoachDe` / `requireOwner` en `src/lib/coach.ts`
   (adiós `src/lib/admin.ts`). El panel se mudó a `/coach` y sólo lee a sus
   alumnos (`getMemberStatuses(ids)`, `getActivity({ userIds })`); `/admin`
   quedó con el mantenimiento, para el dueño, y las URLs viejas redirigen.
   Comentarios: cada coach borra sólo los suyos. Retos del panel: sólo los de
   su grupo. Rutinas, foto y tarjeta de socio: el permiso es "es su coach
   activo", ya no "es admin". Dos cambios a propósito: **el dueño no tiene
   puerta trasera** a los datos de los alumnos de otros coaches (sólo los ve
   su coach), y el coach ya no aparece en su propia lista de alumnos. Smoke
   15/15 con la prueba de aislamiento (§11).
3. [x] **Grupos** (§5). `grupoDe`, `participantesDe` y
   `puedeVerPerfilPublico` en `src/server/acceso.ts`. `getActivity` exige la
   lista de ids (ya no hay forma de leer toda la base) y filtra también las
   series y la natación por grupo; `getTimelines(ids)` arma el XP sólo de
   quienes se piden, con `cache` por clave de texto. Retos por `coach_id`,
   medallas por coaches históricos, foto y tarjeta sólo dentro del grupo. Sin
   coach: tarjeta en vez de ranking. Migración 0006: `coaches.in_ranking`,
   encendido para `bener`. El ranking real salió idéntico al de antes (7 en
   el grupo, `bener` 4.º). Smoke 17/17, con dos pruebas nuevas de grupos.
4. [ ] **Coaches y vínculos** (§4, §6). Registro de coach, `/unirse/[code]`, QR,
   "Mi coach", solicitudes, invitar, copiar rutina a varios alumnos, "De tu
   coach".
5. [ ] **Cobro** (§7). Necesita la cuenta de Stripe. Primero en modo de
   pruebas.
6. [ ] **Panel del dueño, página pública y legales** (§8). `/coaches` con qué
   hace y precios; términos y aviso de privacidad.
7. [ ] **Marca del coach**. Logo, nombre y color en la app de sus alumnos.

Con 1–6 ya se puede vender (fase 3 de negocio.md). Después sigue la app nativa:
`/api/v1` sobre `src/server/` y Expo.

---

## 11. Cómo se sabe que quedó

Además de `npm run build`, `npx eslint src` y el smoke de siempre, en local y
contra producción:

- **Aislamiento (la más importante)**: dos coaches desechables, cada uno con un
  alumno. El coach A **no puede** ver la ficha, las sesiones, la foto, las
  rutinas ni el ranking del alumno de B, ni entrando a la URL directa. Se
  prueba en el smoke, con las URLs a mano.
- Alta de coach → liga → alumno nuevo ligado → el coach le arma rutina → el
  alumno la ve como "De tu coach" y la entrena → sale en el ranking del grupo.
- Solicitud por nombre de usuario: pendiente, aceptada, rechazada.
- Desligar: el coach deja de ver al alumno y el alumno conserva todo.
- Tope: el alumno 31 no entra en el plan Coach.
- Cobro con tarjetas de prueba de Stripe: alta, cobro fallido, 7 días,
  bloqueo, pago y desbloqueo (los días se simulan con el reloj de pruebas de
  Stripe).
- Los 7 usuarios de hoy ven lo mismo que antes.

---

## 12. Decisiones

| Pregunta | Propuesta |
|---|---|
| ¿Los 6 usuarios de hoy son alumnos de `bener`? | Sí (§9) |
| ¿Dónde vive el panel del coach? | `/coach`; `/admin` para el dueño |
| ¿Cuenta de Stripe? | La tuya, con los datos fiscales de ElBe. **Hace falta para el paso 5** |
| ¿El alumno sin coach ve algo en Retos? | La tarjeta para unirse a un coach (§5) |
| ¿Los ejercicios propios del coach los ven sus alumnos? | Sí, los que use en sus rutinas. Hoy son por usuario; se revisa en el paso 4 |
