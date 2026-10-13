# Gamificación y foto de perfil (Decimosexta)

Estado: **propuesta, sin empezar**. Falta que el dueño apruebe esto y cierre
las decisiones de la §8.

## 1. Lo que ya hay

GainLine ya tiene piezas de juego, pero sueltas:

- **Ranking** en Retos: semana o mes, por días, carga, series o natación.
  Empates comparten lugar y quien va en cero no sale
  ([coach-y-retos.md §2](./coach-y-retos.md)).
- **Retos** con fechas y meta que arma el coach, con podio.
- **Racha semanal** en Hoy ("N semanas seguidas"), en
  `getWeeklyStats().streakWeeks`.
- **Anillos** semanales con metas, **récords** con aviso durante la sesión y
  un resumen al terminar.

Lo que **no hay**: nada que se acumule con el tiempo (nivel, rango, XP),
medallas por logros, ni foto para reconocer a la gente en el ranking.

## 2. Lo que se investigó

**Cómo lo hacen las apps de gym:**

- **Liftoff** (más de 1 millón de usuarios) da un rango **de fuerza** por
  ejercicio: Wood, Bronze, Silver, Gold, Platinum, Diamond, Champion, Titan y
  Olympian, en bloques de 100 puntos. Estima el 1RM con Epley,
  `peso × (1 + reps/30)`, y lo compara con curvas de su propia comunidad;
  publica una curva sólo cuando un ejercicio tiene 100,000 registros. Las
  curvas se reajustan, así que el rango se puede mover sin que cambie lo que
  levantas.
  [Comparativa](https://www.sensai.fit/blog/liftoff-vs-lyfta-vs-hevy-2026),
  [App Store](https://apps.apple.com/us/app/liftoff-ranked-gym-workouts/id6448081563).
- **Loadout** da rangos de Bronze a Legend, XP por misiones diarias y
  semanales, y duelos 1 contra 1. Su regla principal: **el rango nunca baja**.
  [Product Hunt](https://www.producthunt.com/p/loadout-2/loadout-3).
- **Hevy** tiene una racha **semanal**: basta un entrenamiento por semana, y
  si se te pasó una semana la recuperas registrándola tarde. La racha de tus
  amigos se ve en su perfil.
  [Ayuda de Hevy](https://help.hevyapp.com/hc/en-us/articles/34467766576279).
- **Duolingo**: ligas semanales de 30 personas al azar, con XP que vuelve a
  cero cada lunes, ascensos y descensos. Necesita mucha gente por liga.
  [Análisis](https://duolingo.deconstructoroffun.com/mechanics/leagues).

**Qué dice la evidencia:**

- Un metaanálisis de 16 ensayos (Mazeas et al., JMIR 2022) encontró que las
  apps con gamificación aumentan la actividad física, con un efecto moderado
  ([DOAJ](https://doaj.org/article/9754f1fd9dd84266b5e5a30336858ad8)).
- Con datos de Fitbit, usar leaderboards se asoció con unos 370 pasos más al
  día, un 3.5 % ([arXiv](https://arxiv.org/pdf/2301.02767)). Es un estudio
  observacional, no un ensayo.
- La preocupación más citada: **la comparación directa puede desanimar a
  quien va abajo**, sobre todo a la gente sedentaria o con poca confianza. No
  encontré un ensayo que lo mida bien, pero es la razón por la que el
  ranking de GainLine ya usa **días** como métrica por omisión.
- Las cifras espectaculares que circulan ("340 % más engagement") vienen de
  blogs de proveedores sin estudio detrás. No se usan aquí.

## 3. Qué tomamos y qué no

**No copiamos los rangos de fuerza de Liftoff.** Aquí no funcionan:

- Las rutinas son de máquinas, y 40 kg en la prensa de un gimnasio no son
  40 kg en la de otro. Las curvas de Liftoff son de barra libre y de su
  propia comunidad.
- Varios socios cargan en **placas**, que no tienen conversión honesta a kg
  (la misma razón por la que no suman carga en los anillos).
- Somos 7 cuentas: no hay datos para armar curvas propias.
- Un rango de fuerza premia a quien ya es fuerte. Lo que este gimnasio
  quiere premiar es **venir**.

**Sí tomamos:**

- De Loadout, **un rango que se gana con XP y nunca baja**.
- De Hevy, **la racha semanal, que ya existe**, a la vista en el perfil.
- **Medallas por logros propios**: cada quien contra sí mismo, no contra
  los demás.
- Un **ranking de XP de la semana** que se reinicia cada lunes, como
  Duolingo pero sin ligas (con 7 personas, una sola tabla basta).

## 4. Propuesta

### 4.1 XP y rango

El XP se gana **por presentarse y trabajar**, no por cuánto levantas, así
que alguien que va empezando puede subir igual de rápido que alguien fuerte:

| Acción | XP | Por qué |
|---|---|---|
| Día entrenado (al menos 1 serie o bloque de natación) | 100 | Lo más importante es venir |
| Serie completada (pesas o isométricos) | 5, hasta 30 series al día | Premia el trabajo, con tope para que nadie infle el número |
| Bloque de natación completado | 15 | Equivale a unas 3 series |
| Récord personal roto | 25 | Progreso contra ti mismo |
| Semana en que cumples tu meta de días | 150 | Tu meta, no la de otro |

Los estiramientos (`measure = 'seconds'`) no dan XP por serie, igual que no
suman series (pero el día sí cuenta).

**Rangos:** 7 rangos con 3 divisiones cada uno (Bronce III → Bronce II →
Bronce I → Plata III…). **Nunca baja.**

| Rango | Desde | Para alguien que viene 4 días por semana |
|---|---|---|
| Bronce | 0 | Al empezar |
| Plata | 1,500 | Unas 3 semanas |
| Oro | 4,000 | 2 meses |
| Platino | 8,000 | 4 meses |
| Diamante | 14,000 | 7 meses |
| Campeón | 22,000 | 11 meses |
| Leyenda | 32,000 | Más de un año |

Calibrado con los datos reales: con sólo días y series, Erika (22 días y
281 series desde septiembre) tendría unos 3,600 XP, o sea Plata, y con sus
récords y semanas cumplidas pasaría a Oro. `karizmendi@grupoargue.com`
(14 días) quedaría en Plata y `reberodriguez` (4 días), en Bronce. El número
exacto sale cuando esté el cálculo.

**No se guarda nada nuevo:** como el ranking actual, el XP se calcula de
`set_logs` y `swim_block_logs`. Así:

- todo el historial cuenta desde el primer día: nadie arranca en cero;
- borrar o corregir una serie corrige el XP sola;
- cambiar los valores de la tabla es cambiar código, sin migrar datos.

### 4.2 Medallas

También se calculan del historial, cada una con la fecha en que se ganó:

- **Constancia:** primer entrenamiento, 10, 25, 50, 100 y 250 días.
- **Racha:** 4, 8, 12 y 26 semanas seguidas.
- **Metas:** primera semana con los tres anillos cerrados, y 4 semanas así.
- **Progreso:** primer récord, 10, 25 y 50 récords.
- **Volumen:** 1, 10 y 100 toneladas movidas (sólo carga en kg o lb).
- **Natación:** 1, 10 y 42.2 km nadados.
- **Retos:** completar un reto del coach y ganar uno.

Al terminar un entrenamiento, el resumen avisa si **subiste de rango** o
**ganaste una medalla** en esa sesión, como hoy avisa los récords. Como cada
medalla tiene fecha, se sabe sin guardar "ya lo vio".

### 4.3 Dónde se ve

- **Hoy:** tu rango, con una barra de XP hacia el siguiente ("Plata II ·
  faltan 340 XP").
- **Perfil:** foto, rango, XP total, racha y tus medallas (las ganadas a
  color, las que faltan en gris con lo que piden).
- **Retos → Ranking:** cada fila con foto y rango. Se agrega la métrica
  **"XP"** a días, carga, series y natación, también por semana o mes.
- **Tarjeta de socio:** al tocar a alguien en el ranking se abre su foto,
  rango, racha y medallas. **No** se ven sus pesos ni sus sesiones: eso
  sigue siendo sólo suyo y del coach.
- **Coach:** la foto en la lista de socios y en la ficha.

Si alguien apagó "aparecer en el ranking" (`show_in_ranking`), tampoco
aparece su tarjeta ni su foto para los demás. Su rango y sus medallas los
sigue viendo él.

## 5. Foto de perfil

**El bloqueo:** el Blob store de Vercel conectado al proyecto es
**privado** y el código sube en público, así que ninguna imagen se ha
guardado nunca (por eso las fotos de ejercicios propios fallan). Arreglarlo
pide crear un store público en el panel de Vercel y conectarlo; está
pendiente desde septiembre.

**Propuesta: guardar la foto en la base, no en Blob.**

- El teléfono la recorta a un cuadrado y la reduce a 256 × 256 en WebP
  antes de subirla, así que pesa unos 10–20 KB. Con 7 cuentas son menos de
  200 KB en total.
- Va en su propia tabla `user_avatars (user_id, image bytea, mime,
  updated_at)`, para que leer `users` no arrastre imágenes.
- Se sirve en `/api/avatar/[userId]?v=<updated_at>` con caché larga: cuando
  cambia la foto, cambia la URL.
- Sólo la ven usuarios con sesión iniciada. Quien está oculto del ranking
  sólo se la ve a sí mismo y al coach.
- Sin foto, sale un círculo con la inicial y un color fijo por persona.

Así la foto no depende de arreglar Blob. Si algún día se arregla, mover las
fotos allá es un script.

## 6. Cambios técnicos

- **Migración:** sólo la tabla `user_avatars`. El XP y las medallas no
  crean tablas.
- `src/lib/xp.ts`: la tabla de XP, los rangos y las medallas, en funciones
  puras y fáciles de probar.
- `src/db/gamificacion.ts`: las consultas (XP por usuario y por rango de
  fechas, medallas con fecha). Reutiliza los criterios de `gym.ts`
  (series que cuentan, días en hora de México, placas fuera de la carga).
- **Pantallas:** Hoy, Perfil (foto y medallas), Retos (métrica XP, fotos,
  tarjeta), resumen de sesión y la lista del coach.
- **Español e inglés** en todo, como el resto de la app.
- **Verificación:** `tsc`, `lint` y `build`; el smoke con una prueba nueva
  (subir foto, ver el rango); y un recorrido con Playwright contra
  producción con una cuenta desechable, oculta del ranking. Capturas en
  claro y oscuro.

## 7. Fases

1. **Foto de perfil**, que se puede usar en cuanto sale.
2. **XP y rango**: Hoy, Perfil y la métrica XP en el ranking.
3. **Medallas** y avisos en el resumen de sesión.
4. **Tarjeta de socio** al tocar a alguien en el ranking.

Cada fase se sube y se verifica por separado.

## 8. Decisiones del dueño

1. **Los valores de XP y los umbrales de rango** (§4.1). Es fácil
   cambiarlos después porque no se guardan.
2. **Los nombres de los rangos**: ¿en español (Bronce… Leyenda) o en inglés
   (Bronze… Legend), ahora que la app se llama GainLine? La propuesta usa
   español porque el resto de la interfaz lo está, y en inglés salen
   traducidos.
3. **¿El XP pasa a ser la métrica por omisión del ranking?** Hoy es "días".
   El XP también premia venir (100 por día) y además el trabajo, así que es
   igual de justo. Recomendación: sí.
4. **Foto en la base** (§5) o arreglar primero el Blob store.
   Recomendación: en la base.
5. **¿Duelos 1 contra 1, como Loadout?** No están en la propuesta: con 7
   personas y fuerzas tan distintas, un duelo de carga lo gana siempre la
   misma persona. Se puede pensar después con una métrica justa, como días
   de la semana.
