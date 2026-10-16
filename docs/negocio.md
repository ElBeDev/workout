# GainLine como negocio: el coach paga, el alumno entrena gratis

Estado: **aprobado por el dueño el 2026-10-15; en construcción.** La fase 1
está completa, de la fase 3 ya están la página pública y los legales (en
borrador), y la fase 2 (cobro) espera a que Stripe apruebe la cuenta: lo que ya está y lo que falta, paso por paso, en
[coaches.md → "Dónde vamos"](./coaches.md#dónde-vamos). Precios de la
competencia tomados de sitios de terceros en 2026 (fuentes al final): hay que
confirmarlos antes de usarlos en una venta.

---

## 1. Quién paga y por qué

**Paga el coach, no el alumno.** El alumno usa la app gratis; el coach paga una
mensualidad fija de $199 MXN con todo incluido (§4).

- El coach es el que tiene el problema y el presupuesto: armar rutinas, ver
  quién no ha venido y que sus alumnos no lo dejen. GainLine ya hace eso (panel
  del coach, comentarios, XP, ranking, retos, ver
  [coach-y-retos.md](./coach-y-retos.md) y [gamificacion.md](./gamificacion.md)).
- Cobrarle al alumno en la tienda es pelear contra apps gratis (Hevy, Strong) y
  darle a Apple su parte. Un coach con 30 alumnos paga cada mes; conseguir 30
  suscriptores sueltos es mucho más difícil.
- Como el alumno no compra nada dentro de la app, no hace falta la compra
  dentro de la app de Apple ni de Google: el coach paga por fuera, con tarjeta.
  La app no debe tener botones de "comprar" para el alumno.

**El coach es el centro, no el gimnasio.** Un coach trabaja en varios gimnasios,
o en ninguno (en línea, en parques, a domicilio). Si la app se separara por
gimnasio, el coach tendría que tener una cuenta por gimnasio y sus alumnos
quedarían repartidos. Por eso la separación es **por los alumnos de cada coach**.
Los gimnasios llegan después, como un equipo de coaches (§3.7).

---

## 2. Cómo lo hacen las otras

| App | Quién paga | Cómo se conecta el alumno | Marca propia |
|---|---|---|---|
| **Hevy Coach** | El coach, por número de alumnos (≈ 25 USD por 1–10, 50 por 11–25, 90 por 26–50, 160 por 51–100) | El coach invita; el alumno usa **la app normal y gratis de Hevy**, ligada a su coach | No |
| **TrueCoach** | El coach, por alumnos activos (≈ 30 USD por 5, 70 por 20, 165 por 50) | El coach invita por correo | No |
| **Trainerize** | El coach o el estudio (≈ 25 USD por 5, ≈ 120 por 50; estudios ≈ 250–380 por sede) | El coach invita por correo; cada negocio tiene su dirección `nombre.trainerize.com` | Sí, como extra (≈ 169 USD de una vez + cuenta de Apple del coach) |
| **Everfit** | El coach; **gratis hasta 5 alumnos**, ≈ 19 USD por 5, ≈ 105 USD por 50 | El coach invita | No |
| **Hexfit** | El coach, ≈ 30 USD al mes con alumnos ilimitados | El coach invita | Sí, la arma su equipo |
| **PushPress / Glofox** | El gimnasio (≈ 159–229 USD al mes) | El gimnasio da de alta al socio | Sí, como extra (≈ 80–300 USD al mes) |

Lo que sacamos de ahí:

- **El modelo más parecido a lo que queremos es Hevy Coach**: una app gratis para
  entrenar y una capa para el coach encima. Cobra por alumno y no tiene marca
  propia: ahí GainLine puede ser mejor.
- **Casi todas conectan con una invitación del coach.** Nadie resolvió bien que
  el alumno *busque* a su coach dentro de la app: en Trainerize es una de las
  peticiones de sus usuarios. Un directorio de coaches puede ser una ventaja
  nuestra más adelante (§3.8).
- **Nadie cobra al alumno.** El que paga es el negocio.

---

## 3. Cómo funciona en GainLine

### 3.1 Dos tipos de cuenta

Al **crear la cuenta** se elige:

- **"Voy a entrenar"**: alumno. Gratis.
- **"Soy coach"**: coach. Arranca con 14 días de prueba y luego paga (§5).

Un coach **también entrena**: tiene sus rutinas, su progreso y su XP como
cualquier alumno, más su panel.

**En el inicio de sesión no se pregunta el tipo**: la cuenta ya lo sabe, y una
pregunta de más sólo produce errores ("elegí coach y no me deja entrar"). El
login tiene dos ligas para crear cuenta: *"Crear cuenta para entrenar"* y
*"Soy coach"*.

### 3.2 Cómo se conectan alumno y coach

Cada coach tiene un **código corto** (`GL-7K3P`), una **liga** y un **QR** que
comparte por WhatsApp o pega en el gimnasio. Tres caminos:

1. **El alumno abre la liga o escanea el QR**: crea su cuenta (o entra) y queda
   ligado al coach de una vez. Es el camino principal.
2. **El alumno escribe el código** en Perfil → "Mi coach", si ya tenía cuenta.
3. **El alumno busca al coach por su nombre de usuario**: eso manda una
   **solicitud** que el coach acepta o rechaza. Así nadie se cuela en la lista
   de un coach.

El coach ve en su panel a quién invitó, quién está esperando que lo acepte y
quién está activo.

### 3.3 Los datos son del alumno

Esta es la diferencia más importante frente al modelo por gimnasio:

- **El historial, las rutinas y el XP son del alumno.** Si cambia de coach, se
  lleva todo.
- **El coach ve al alumno sólo mientras están ligados.** Si se desligan (lo
  puede hacer cualquiera de los dos), el coach deja de ver sus datos; el alumno
  no pierde nada.
- Las rutinas que armó el coach se quedan con el alumno, marcadas como "De tu
  coach", y el alumno las sigue pudiendo usar.

### 3.4 Qué hace el coach

Lo que hoy hace `/admin`, pero **sólo con sus alumnos**:

- Armar y asignar rutinas (ya existe: hoy el admin arma rutinas a cualquiera).
- Ver progreso, quién no ha venido en 10 días, sesiones, y dejar comentarios
  (ya existe).
- Retos para sus alumnos (ya existe, hoy son para todos).
- Plantillas de rutina para copiarlas a varios alumnos de una vez (nuevo: hoy
  se copian a mano).

### 3.5 Ranking y retos por grupo

El ranking y los retos de hoy son de todo el mundo. Pasan a ser **del grupo de
cada coach**: un alumno compite con los demás alumnos de su coach. Un alumno
sin coach entrena solo, sin ranking (o con amigos, más adelante).

### 3.6 Un coach o varios

**Para empezar: un coach a la vez.** Es lo que hace todo el mundo y evita
preguntas como "¿de quién es esta rutina?" o "¿en qué ranking salgo?". Si un
alumno quiere coach de pesas y coach de natación, se revisa después (§8).

### 3.7 Gimnasios: un equipo de coaches (después)

Un gimnasio es un **equipo**: varios coaches bajo una sola cuenta que paga, con
la marca del gimnasio. Cada coach sigue con sus alumnos, y el dueño del
gimnasio ve a todos. Si un coach del equipo también da clases por su lado, esos
alumnos son de su cuenta personal, no del gimnasio. Por eso el equipo se agrega
**encima** del modelo de coach, no al revés.

### 3.8 Más adelante

- **Directorio de coaches**: el alumno sin coach busca uno por ciudad o
  especialidad. Da clientes nuevos al coach, y es otra razón para pagar.
- **El coach le cobra a sus alumnos desde la app**, y GainLine se queda con una
  comisión. Trainerize lo vende como extra.

---

## 4. Precios (México)

### De dónde sale el precio

Los precios de las apps de fuera están pensados para coaches que cobran en
dólares. En México la cuenta es otra:

- **Lo que gana un coach**: en gimnasio, $8,000–15,000 MXN al mes; por su
  cuenta, con cartera estable, $15,000–30,000 MXN.
- **Lo que le paga un alumno**: entrenamiento en línea, $300–1,600 MXN al mes;
  presencial, $250–1,000 MXN por sesión según la ciudad.
- **La competencia**: Everfit ≈ 19 USD (≈ $350 MXN) por 5 alumnos, Hevy Coach
  ≈ 25 USD (≈ $460 MXN) por hasta 10, Hexfit ≈ 30 USD (≈ $550 MXN). Todas
  cobran en dólares, y ninguna está pensada primero en español ni para México.

**$199 MXN al mes** (≈ 10 USD) es **la mitad que la opción de pago más barata
de fuera**, alrededor del 1–2 % de lo que gana un coach, y **menos de lo que le
paga un solo alumno**. Esa es la frase de venta: *"te cuesta menos que un
alumno"*.

### Planes

| Plan | Para | Precio |
|---|---|---|
| **Alumno** | Con o sin coach | Gratis |
| **Coach** | Todo incluido: panel, rutinas, comentarios, retos, ranking, su marca en la app. Hasta 30 alumnos | **$199 MXN al mes**, o $1,990 al año (2 meses gratis) |
| **Coach con más de 30 alumnos** | Lo mismo, sin tope | $399 MXN al mes |
| **Gimnasio / equipo** | Varios coaches, una cuenta que paga (fase 6) | $999 MXN al mes |
| **App con marca propia** | Su ícono y nombre en las tiendas (fase 6) | $6,000 MXN de alta + $299 MXN al mes. Las cuentas de Apple (99 USD al año) y Google son del cliente |

- **Por qué un tope de 30**: la mayoría de los coaches tiene 10–30 alumnos, así
  que para casi todos es "$199 con todo". El que tiene 80 alumnos gana mucho
  más, y cada alumno cuesta servidor y notificaciones: que pague el doble es
  justo y sigue siendo barato. Si se prefiere un solo precio sin tope, se puede,
  pero se deja dinero en los coaches grandes (§8).
- **14 días de prueba con tarjeta.** Everfit da gratis hasta 5 alumnos para
  siempre; aquí no, por lo de FiTME. Se puede revisar si cuesta ventas (§8).
- **¿IVA incluido?** Si los $199 incluyen IVA, quedan ≈ $172. Stripe cobra
  ≈ 3.6 % + $3 MXN + IVA por cobro, ≈ $12. Quedan **≈ $160 limpios por coach
  al mes**: 100 coaches son ≈ $16,000 MXN al mes, 500 son ≈ $80,000.

---

## 5. Cobro: que nadie use la app sin pagar

Lo aprendido con FiTME, el gimnasio que nunca pagó: **sin tarjeta no hay
cuenta de coach.**

- **Stripe Billing** (funciona en México): suscripción mensual o anual, cobro
  automático, recibos por correo.
- **Si falla un cobro**: Stripe reintenta, el coach ve un aviso y tiene 7 días.
  Después el **panel del coach se bloquea** (no puede armar rutinas, ver
  alumnos ni crear retos). Los alumnos **siguen entrenando** con lo que ya
  tienen: el castigo es para quien no paga, no para sus alumnos.
- **Página "Mi plan"** para el coach: plan, alumnos usados, tarjeta, facturas,
  cancelar.
- **Factura (CFDI)**: Stripe no emite CFDI. Si los coaches la piden, hace falta
  un servicio de facturación (por ejemplo Facturapi). Ver §8.

---

## 6. Pasos

El plan técnico de las fases 1, 2 y 4 está en [coaches.md](./coaches.md).

Orden pensado para **cobrar lo antes posible**: primero lo que deja vender con
la app web que ya existe; la app nativa llega cuando ya hay coaches pagando.

### Fase 1: cuentas de coach y alumnos ligados

- [x] `users.role`: `member` o `coach`; `is_admin` queda como el dueño (tú),
      que ve a todos los coaches.
- [x] Registro con la elección "Voy a entrenar" / "Soy coach" (§3.1): en el
      login, "Regístrate · Soy coach".
- [x] Tabla `coach_clients` (`coach_id`, `client_id`, estado `pending` /
      `active` / `ended`, fechas). Un solo vínculo abierto por alumno,
      garantizado por la base.
- [x] Código, liga y QR del coach, más la solicitud por nombre de usuario
      (§3.2). En el alumno, Perfil → "Mi coach", con "Dejar a mi coach". La
      tuya: `/unirse/GL-27DE`.
- [x] El panel del coach (ahora en `/coach`) **sólo con sus alumnos**. Probado
      en cada smoke: un coach no ve nada de los alumnos de otro, ni con la URL
      directa.
- [x] Rutinas armadas por el coach marcadas "De tu coach", y copiar una
      rutina a varios alumnos de una vez.
- [x] Ranking y retos por grupo del coach (§3.5). Los coaches no compiten,
      salvo tú.
- [x] Migrar lo de hoy: `bener` es coach (gratis) y los otros 6 sus alumnos.
      Para ellos no cambió nada.

### Fase 2: cobro

- [ ] Stripe Billing con los planes de §4, prueba de 14 días con tarjeta.
- [ ] Webhooks de Stripe: estado del plan en la base, bloqueo al fallar el
      cobro (§5), tope de alumnos por plan.
- [ ] Página "Mi plan" del coach.
- [x] Términos de servicio y aviso de privacidad (en `/terminos` y `/privacidad`, como borrador hasta tener tus datos y la revisión de un abogado) (los pide la ley y los pedirán
      las tiendas).

### Fase 3: vender

- [x] Página pública de GainLine para coaches: qué hace, precios, "Prueba 14
      días". En `/coaches`.
- [ ] Conseguir los **primeros 3–5 coaches** que paguen, con la app web
      instalable que ya funciona en el celular.
- [ ] Lo que pidan ellos decide qué sigue. Plantillas de rutina (§3.4) es el
      candidato obvio.

### Fase 4: la marca del coach

- [ ] Logo, nombre y color del coach o del equipo. Sus alumnos los ven en la
      app al estar ligados (login, encabezado, Hoy).
- [ ] Lo de GainLine (nombre en la tienda, ícono) no cambia: es la app de todos.

### Fase 5: app de iOS y Android

- [ ] **Expo (React Native)**, un solo código para las dos. El servidor de hoy
      (Next.js + Neon) sigue de base: se reusan la lógica, el XP, el ranking y
      los retos.
- [ ] **API para la app** (`/api/v1/...`) con inicio de sesión por token: las
      server actions de Next.js no se pueden llamar desde una app nativa. La web
      sigue igual.
- [ ] Pantallas: Hoy, Rutinas, Entrenar (con modo sin conexión, como hoy),
      Progreso, Retos, Perfil y el panel del coach.
- [ ] Notificaciones nativas (APNs y FCM, con Expo) en lugar de web push.
- [ ] Requisitos de las tiendas: borrar la cuenta desde la app (Apple lo
      exige), aviso de privacidad y capturas.
- [ ] Publicar **una sola app "GainLine"** en App Store y Google Play.
- [ ] Extra que ayuda con la revisión de Apple: Apple Health y Google Health
      Connect.

### Fase 6: equipos y marca propia

- [ ] Equipos / gimnasios: varios coaches, una cuenta que paga (§3.7).
- [ ] **Apps con marca propia**, sólo para quien pague la alta. Apple rechaza
      apps de plantilla publicadas por el proveedor en nombre de sus clientes
      (guía 4.2.6): cada una sale **en la cuenta de desarrollador del
      cliente**, que te agrega a su equipo. Se construye del mismo código con
      su marca.

---

## 7. Qué cambia del código de hoy

| Hoy | Después |
|---|---|
| `users.is_admin`: un coach que ve a todos | `users.role` + `coach_clients`: cada coach ve sólo a sus alumnos |
| Ranking y retos de todo el mundo (`getActivity` lee a todos los usuarios) | Ranking y retos del grupo de cada coach |
| Rutinas sin autor | `routines.created_by`, para "De tu coach" |
| Usuarios nuevos nacen vacíos | Nacen ligados a su coach, que les asigna rutina |
| Marca GainLine fija en `layout`, `manifest`, login, registro y push | La marca del coach dentro de la app (fase 4) |
| Web push | Notificaciones nativas (fase 5) |
| Server actions | API con token para la app nativa (fase 5) |

El catálogo de ejercicios sigue siendo de todos. Los ejercicios propios siguen
siendo de quien los crea; un coach podrá compartir los suyos con sus alumnos.

---

## 8. Decisiones abiertas

- **¿Un coach o varios por alumno?** Propuesta: uno a la vez para empezar (§3.6).
- **¿Tope de 30 alumnos en el plan de $199, o un solo precio sin tope?**
  Propuesta: tope de 30 y $399 arriba de eso (§4).
- **¿Qué cuenta como alumno para el tope?** Propuesta: ligado al coach. Otra
  opción es "entrenó en los últimos 30 días", más justa para el coach pero más
  difícil de explicar.
- **¿Plan gratis para coaches con pocos alumnos** (como Everfit, hasta 5)? Ayuda
  a que lo prueben, pero es justo lo que FiTME aprovechó. Propuesta: no, sólo
  la prueba de 14 días.
- **¿Los $199 incluyen IVA?** Propuesta: sí, como se anuncia al público en
  México.
- **Factura CFDI**: ¿se ofrece desde el principio o cuando la pida alguien?
- **¿Precios en pesos o en dólares?** Pesos para México; en dólares si se
  vende fuera (ahí el precio puede ser más alto).
- **Alumno sin coach**: ¿entrena solo y gratis para siempre, o se le limita algo
  para empujarlo a buscar coach?

---

## Fuentes

Precios y funcionamiento de la competencia (sitios de terceros, 2026):

- [Everfit: precios 2026 (QuickCoach)](https://www.quickcoach.fit/everfit-pricing-2026.html)
- [Hexfit: reseña 2026 (Promealplan)](https://www.promealplan.com/es/blog/hexfit-resena-2026)

- [Hevy Coach: reseña (Coachway)](https://coachway.io/articles/hevy-coach-review)
- [Hevy Coach: planes (Zoftwarehub)](https://zoftwarehub.com/products/hevy-coach/plans)
- [TrueCoach: precios 2026 (QuickCoach)](https://www.quickcoach.fit/truecoach-pricing-2026.html)
- [TrueCoach: precios (Coachway)](https://coachway.io/articles/truecoach-pricing/)
- [Trainerize: precios 2026 (FitBudd)](https://www.fitbudd.com/insights/trainerize-pricing-explained-what-it-actually-costs-trainers-in-2026-vs-better-alternatives)
- [Trainerize: precios (Costbench)](https://costbench.com/software/gym-management/trainerize/)
- [Trainerize: petición de buscar coach en la app](https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/46062994-allow-people-outside-app-to-find-me-as-a-trainer-i)
- [PushPress: precios (Wodify)](https://www.wodify.com/blog/pushpress-pricing-plans)
- [Cuánto gana un entrenador personal en 2026 (Promealplan)](https://www.promealplan.com/es/blog/cuanto-gana-entrenador-personal-coach-nutricional)
- [Cuánto cobra un entrenador personal en México (Cronoshare)](https://www.cronoshare.com.mx/cuanto-cuesta/entrenador-personal)
- [Entrenador personal en línea en México (Cronoshare)](https://www.cronoshare.com.mx/cuanto-cuesta/entrenador-personal-online)
- [Comparativa de CRMs de gimnasio (DEV Community)](https://dev.to/reaperoak/best-crm-for-gyms-pushpress-wodify-zen-planner-mindbody-and-glofox-compared-5e2p)
