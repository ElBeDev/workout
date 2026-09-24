# Rediseño visual: FiTME al estilo Apple Fitness

> Estado (2026-09-22, noche): **fases 0 a 4 completas; 5 y 6 a medias** — lo que queda
> está marcado con ⏳ en la sección 9. Después del rediseño entraron tres tandas que
> recoge la bitácora: la presentación de los gifs, el selector de tema y el chip de
> unidad de carga en el entrenamiento.
> Alcance: sólo capa visual + 3 features nuevas de producto que el estilo pide
> (anillos con metas, tendencias, resumen post-sesión). No toca la base de datos
> salvo lo listado en la sección 8.

## Índice

1. [Qué estaba mal con el diseño anterior](#1-qué-estaba-mal-con-el-diseño-anterior)
2. [Cómo es Apple Fitness de verdad (investigación)](#2-cómo-es-apple-fitness-de-verdad-investigación)
3. [Los 8 principios que sí vamos a copiar](#3-los-8-principios-que-sí-vamos-a-copiar)
4. [Sistema de diseño nuevo (tokens)](#4-sistema-de-diseño-nuevo-tokens)
5. [Componentes](#5-componentes)
6. [Pantalla por pantalla](#6-pantalla-por-pantalla)
7. [Qué podemos poner que hoy no está](#7-qué-podemos-poner-que-hoy-no-está)
8. [Lo que sí toca la base de datos](#8-lo-que-sí-toca-la-base-de-datos)
9. [Plan de implementación por fases](#9-plan-de-implementación-por-fases)
10. [Accesibilidad y detalles finos](#10-accesibilidad-y-detalles-finos)
11. [Qué NO copiar de Apple](#11-qué-no-copiar-de-apple)
12. [Fuentes](#12-fuentes)
13. [Bitácora](#13-bitácora)

---

## 1. Qué estaba mal con el diseño anterior

Lo de abajo describe el sistema lavanda (`#ebe7fb`, tarjetas blancas, píldoras negras,
fuente Outfit) que estuvo en producción hasta `1bf4729` (2026-09-22). Se deja escrito
porque es el diagnóstico que justifica cada decisión de las secciones 3 y 4 — no es el
estado de la app.

El diseño venía de un shot de Dribbble y era correcto, pero tenía cuatro problemas
concretos:

| Problema | Dónde se ve | Por qué importa |
|---|---|---|
| **Todo pesaba igual** | Home: la tarjeta de "en curso", los 2 stats y cada rutina usaban la misma `Card` blanca con el mismo radio y la misma sombra | No había jerarquía: el ojo no sabía dónde empezar. En Fitness siempre hay *un* héroe por pantalla. |
| **El color no significaba nada** | `--accent` lavanda se usaba para el HUD, para los íconos de stats, para el ícono de sesión en Progreso y para la tarjeta de sesión en curso | El color debería codificar *datos* (carga, series, racha), no decorar. |
| **Los números estaban escondidos** | `20px` para "2 esta semana", `13px` para series/reps, el HUD mezclaba 3 relojes del mismo tamaño | Esta app es un tracker: el dato **es** el contenido y debería ser lo más grande de la pantalla. |
| **Cero visualización de progreso en la portada** | El heatmap y las gráficas vivían enterrados en `/progreso` | Fitness pone el progreso del día como primer pixel de la app. Es la razón por la que la abres. |

Lo que sí funciona y se conserva: mobile-first con `max-w-md`, nav flotante,
bottom sheets, radios grandes, modo oscuro real, `tabular-nums` en los relojes.

---

## 2. Cómo es Apple Fitness de verdad (investigación)

### 2.1 Estructura

La app de iPhone tiene 3 tabs: **Resumen**, **Fitness+** y **Compartir**. La que
nos interesa es Resumen, que es un scroll vertical de tarjetas agrupadas:

```
Martes, 22 de sep.          ← fecha en rojo, mayúsculas, 13pt semibold
Resumen                     ← large title 34pt bold, blanco sobre negro

┌──────────────────────────────────────┐
│  Actividad                        ›  │  ← tarjeta héroe
│                                      │
│   ╭───────╮     Movimiento           │
│   │ ╭───╮ │     450/500 CAL          │  ← número grande, color del anillo
│   │ │ ◯ │ │     Ejercicio            │
│   │ ╰───╯ │     28/30 MIN            │
│   ╰───────╯     De pie               │
│                 9/12 H               │
└──────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐
│ Pasos        │  │ Distancia    │       ← grid 2×N de "metric tiles"
│ 8,432        │  │ 6.1 KM       │
└──────────────┘  └──────────────┘

Entrenamientos                      Ver todo ›
┌──────────────────────────────────────┐
│ 🏃 Carrera al aire libre             │
│    32 min · 410 CAL · 5.2 km      ›  │
└──────────────────────────────────────┘
```

### 2.2 Los anillos

Tres anillos concéntricos, cada uno una métrica con meta diaria:

| Anillo | Métrica | Color base |
|---|---|---|
| Move (Movimiento) | calorías activas | `#FA114F` (rosa-rojo) |
| Exercise (Ejercicio) | minutos de actividad | `#92E82A` (verde lima) |
| Stand (De pie) | horas con al menos 1 min de pie | `#1EEAEF` (cian) |

Detalles de ejecución que son los que hacen que se vean "Apple":

- Cada anillo va de su color base a una versión **más clara y más amarilla /
  más brillante** (degradado a lo largo del arco), no es un color plano.
- El **track** (la parte no completada) es el mismo color al ~22 % de opacidad,
  no gris.
- Extremos **redondeados** (`stroke-linecap: round`) y, cuando pasas del 100 %,
  el arco sigue girando y se dibuja **encima** con una sombra suave — por eso
  se ve el "escalón" cuando cierras el anillo dos veces.
- Grosor generoso: el anillo exterior ocupa ~1/6 de su radio; hueco de ~4 px
  entre anillos.
- Animación: al entrar a la pantalla los tres arcos crecen desde 0 con un
  spring, ligeramente escalonados.

### 2.3 Color

- **Lienzo negro puro** (`#000`) en oscuro y `#F2F2F7` en claro. Nunca un color
  de marca de fondo.
- **Las tarjetas son gris neutro** (`#1C1C1E` oscuro / `#FFF` claro). Sin
  sombras en oscuro: la jerarquía se hace con el escalón de gris.
- **Todo el color de la app viene de los datos**: los anillos y sus métricas.
  Un número rosa significa "movimiento", uno verde "ejercicio". Nunca hay un
  botón rosa que no tenga que ver con el anillo rosa.
- Acento de la UI (links, "Ver todo", chevrons activos) = el rosa del anillo
  Move.

### 2.4 Tipografía

- SF Pro para todo, con la rampa de opacidad de Apple para jerarquía
  (`label` 100 %, `secondaryLabel` 60 %, `tertiaryLabel` 30 %) en vez de meter
  más grises distintos.
- **Large title 34pt bold** que se encoge a 17pt semibold al hacer scroll.
- **Etiquetas de sección en mayúsculas**, 13pt semibold, en el color del dato
  ("MOVIMIENTO" en rosa, "EJERCICIO" en verde).
- **Números enormes con `tabular-nums`** para las métricas: 28–34pt bold, con
  la unidad pegada en 13–15pt y en gris.
- Fitness usa además SF Rounded en algunas métricas de entrenamiento.

### 2.5 Otros patrones que roban la atención

- **Tarjeta de entrenamiento terminado**: mapa/artwork arriba, y abajo un grid
  de métricas (Tiempo total, Kcal activas, Kcal totales, FC media) donde cada
  valor es grande y coloreado y su etiqueta es chiquita y gris **arriba** del
  valor (al revés de lo normal).
- **Tendencias**: flechas ↑/↓ comparando los últimos 90 días contra el año,
  con frases en lenguaje natural ("Vas mejor que tu promedio").
- **Premios**: medallas 3D por rachas y récords, en un carrusel horizontal.
- **Historial de anillos**: un calendario mensual donde cada día es un mini
  trío de anillos — probablemente el mejor gráfico de "consistencia" que existe.
- **iOS 26**: la tab bar ya no es una barra pegada al borde; es una **cápsula
  flotante de Liquid Glass** (translúcida, con blur y saturación), separada del
  borde, que se minimiza al hacer scroll. El vidrio se reserva para la capa de
  navegación; el contenido nunca es de vidrio.

---

## 3. Los 8 principios que sí vamos a copiar

1. **Negro (u off-white) de lienzo, gris neutro de tarjeta.** El fondo lavanda
   se va.
2. **El color lo pone el dato.** Tres colores con significado fijo en toda la
   app: carga (rosa), series (verde), constancia (cian).
3. **Un héroe por pantalla.** En Home, los anillos. En Entrenar, el HUD. En
   Progreso, la tendencia.
4. **El número es el contenido.** Métrica en 32–44 px bold tabular; etiqueta en
   11–13 px mayúsculas gris.
5. **Jerarquía por opacidad, no por más grises.** 100 % / 60 % / 30 %.
6. **Grupos de tarjetas, no tarjetas sueltas.** Filas dentro de una misma
   tarjeta con separadores hairline, como las listas agrupadas de iOS.
7. **Navegación de vidrio, contenido opaco.** La nav flotante actual pasa a
   `backdrop-filter`, el resto no.
8. **Movimiento con propósito.** Sólo se anima lo que representa progreso
   (anillos, barras, check de serie), con spring corto y respetando
   `prefers-reduced-motion`.

---

## 4. Sistema de diseño nuevo (tokens)

### 4.1 Paleta

Este es el sistema que vive en `src/app/globals.css`. Modo oscuro primero (es el modo
"nativo" de este estilo), claro como espejo. Tres cosas que no hay que "corregir" al
volver aquí: los tokens de texto van más oscuros en claro que la propuesta original,
los arcos tienen tokens propios, y el bloque oscuro está escrito **dos veces** a
propósito.

```css
@import "tailwindcss";

/* El tema se puede forzar desde Perfil: `data-theme="light"|"dark"` en <html> manda
   sobre la preferencia del sistema. Por eso el variante `dark:` de Tailwind se
   redefine: el de fábrica sólo mira `prefers-color-scheme` y contradiría al selector. */
@custom-variant dark {
  @media (prefers-color-scheme: dark) {
    &:where(:root:not([data-theme="light"]), :root:not([data-theme="light"]) *) { @slot; }
  }
  &:where([data-theme="dark"], [data-theme="dark"] *) { @slot; }
}

:root {
  /* Lienzo y superficies — claro */
  --background: #f2f2f7;   /* gris sistema, NO blanco: deja respirar la tarjeta */
  --surface: #ffffff;
  --surface-2: #e9e9ef;
  --surface-3: #dcdce4;

  /* Texto: rampa de opacidad, no más grises distintos */
  --foreground: #000000;
  --muted: rgba(60, 60, 67, 0.6);
  --faint: rgba(60, 60, 67, 0.32);
  --border: rgba(60, 60, 67, 0.16);   /* el hairline; se usa como `border-border` */

  /* Datos: los tres anillos, en su versión legible como TEXTO */
  --ring-load: #e00d45;
  --ring-load-2: #ff5e79;
  --ring-sets: #5aa81f;
  --ring-sets-2: #92e82a;
  --ring-days: #0091a8;
  --ring-days-2: #1eeaef;

  /* Arcos: siempre los colores vivos (son formas, no texto, y no tienen que pasar
     contraste de lectura). No se redefinen en oscuro: son los mismos. */
  --arc-load: #fa114f;
  --arc-load-2: #ff7a8f;
  --arc-sets: #7ad619;
  --arc-sets-2: #c6ff5e;
  --arc-days: #00c9d6;
  --arc-days-2: #7bf6ff;

  /* Semánticos */
  --accent: var(--ring-load);
  --accent-foreground: #ffffff;
  --accent-strong: var(--ring-load);
  --primary: #000000;
  --primary-foreground: #ffffff;
  --danger: #d70015;
  --warning: #b25000;
  --success: var(--ring-sets);

  /* Vidrio de la navegación */
  --glass: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(0, 0, 0, 0.08);
  --shadow-hero: 0 1px 2px rgba(0, 0, 0, 0.04), 0 10px 30px rgba(0, 0, 0, 0.08);

  color-scheme: light;   /* scrollbars e inputs nativos del color correcto */
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --background: #000000;   /* negro puro, como Fitness */
    --surface: #1c1c1e;
    --surface-2: #2c2c2e;
    --surface-3: #3a3a3c;

    --foreground: #ffffff;
    --muted: rgba(235, 235, 245, 0.6);
    --faint: rgba(235, 235, 245, 0.3);
    --border: rgba(235, 235, 245, 0.14);

    --ring-load: #ff375f;
    --ring-load-2: #ff6482;
    --ring-sets: #92e82a;    /* en oscuro sí se usa el lima original */
    --ring-sets-2: #c6ff5e;
    --ring-days: #1eeaef;
    --ring-days-2: #7bf6ff;

    --accent: var(--ring-load);
    --accent-foreground: #ffffff;
    --accent-strong: var(--ring-load);
    --primary: #ffffff;
    --primary-foreground: #000000;
    --danger: #ff453a;
    --warning: #ffd60a;

    --glass: rgba(28, 28, 30, 0.72);
    --glass-border: rgba(255, 255, 255, 0.12);
    --shadow-hero: none;

    color-scheme: dark;
  }
}

/* …y se repite tal cual para el tema oscuro forzado desde Perfil. Duplicado a
   propósito: es más barato repetir 25 líneas que hacer malabares con :is() y
   perder especificidad. */
:root[data-theme="dark"] { /* mismas variables que el bloque de arriba */ }

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-faint: var(--faint);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent-strong: var(--accent-strong);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-danger: var(--danger);
  --color-warning: var(--warning);
  --color-success: var(--success);
  --color-load: var(--ring-load);
  --color-sets: var(--ring-sets);
  --color-days: var(--ring-days);

  --font-sans: var(--font-inter);
  --radius-card: 1.25rem;   /* 20px */
  --radius-tile: 1rem;      /* 16px */
  --radius-field: 0.75rem;  /* 12px */
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), -apple-system, BlinkMacSystemFont, "Segoe UI",
    Helvetica, Arial, sans-serif;
  /* Números de ancho fijo en toda la app: los datos no bailan al contar. */
  font-feature-settings: "tnum" 1;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

> Nota de contraste: `#92E82A` sobre blanco da ~1.7:1, ilegible. Por eso en claro los
> tres colores de dato van oscurecidos (`--ring-load: #e00d45`, `--ring-sets: #5aa81f`,
> `--ring-days: #0091a8`) y en oscuro se usan los vivos. De ahí las dos familias:
> `--ring-*` para texto y etiquetas, `--arc-*` para arcos, trazos de gráfica y rellenos
> (vivos en los dos modos, porque son formas y no texto). Si estás pintando algo que se
> lee, es `--ring-*`; si es una forma, es `--arc-*`.

### 4.2 Tipografía

SF Pro no se puede usar fuera de plataformas Apple (licencia). El sustituto con
las métricas más parecidas es **Inter**; para los números grandes se ve aún más
"Apple" con `font-variation-settings` apretado. Cambio en `layout.tsx`:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
```

Escala (px, todos con `tracking` negativo salvo las etiquetas):

| Rol | Tamaño / peso | Uso |
|---|---|---|
| `display` | 44 / 700, `-0.03em`, tabular | El número del HUD, kg totales de una sesión |
| `metric` | 28 / 700, `-0.02em`, tabular | Valor de un tile, "450/500" |
| `largeTitle` | 34 / 700, `-0.02em` | Título de pantalla ("Resumen", "Rutinas") |
| `title` | 22 / 700 | Nombre de rutina en su detalle |
| `headline` | 17 / 600 | Título de fila / tarjeta |
| `body` | 17 / 400 | Texto normal |
| `subhead` | 15 / 400, `--muted` | Subtítulos, metadatos |
| `footnote` | 13 / 400, `--muted` | Metadatos secundarios |
| `label` | 12 / 600, `0.06em`, **MAYÚSCULAS** | "SERIES", "CARGA", "HOY TOCA" |

### 4.3 Espaciado, radios y elevación

- Gutter de página: **20 px** (hoy 20, se queda).
- Separación entre tarjetas: **12 px**; entre secciones: **28 px**.
- Padding interno de tarjeta: **16 px**; de tarjeta héroe: **20 px**.
- Radios: tarjeta 20, tile 16, campo 12, sheet 28 (arriba), botón principal
  píldora, botón circular 44.
- Objetivo táctil mínimo **44×44**.
- Elevación: en oscuro **sin sombra** (escalón de gris). En claro,
  `0 1px 2px rgba(0,0,0,.04), 0 10px 30px rgba(0,0,0,.08)` sólo en la tarjeta
  héroe y en la nav; las demás llevan hairline `border-border`.

### 4.4 Movimiento

No hay tokens de movimiento: son tres animaciones contadas y viven donde se usan.

- **Anillos** (`@keyframes ring-fill`): `stroke-dashoffset` desde la circunferencia
  completa, 700 ms `cubic-bezier(.22, 1, .36, 1)` —una salida, no un rebote: un anillo
  que se pasa y regresa se lee como dato equivocado— escalonados 90 ms entre anillos.
- **Check de serie** (`.animate-pop`): 0.9 → 1.06 → 1 en 260 ms con
  `cubic-bezier(.34, 1.56, .64, 1)`. Ahí sí rebote, porque celebra.
- **Punto de "en curso"** (`.animate-dot`): opacidad 1 → .35 → 1, 1.6 s infinito.
- Tap en tarjeta: `active:scale-[0.985]`.

Si algún día son más de tres, entonces sí tokens. `prefers-reduced-motion` no las apaga
una por una: `globals.css` baja toda animación y transición a `0.01ms !important` sobre
`*`, así el estado final se ve igual y nada se mueve.

---

## 5. Componentes

### 5.1 Nuevos

**`<Ring />` y `<RingTrio />`** — SVG, sin dependencias.

```tsx
// Un anillo = dos círculos: track (mismo color al 20 %) + arco con degradado.
// El color sale de --arc-*, NO de --ring-*: el arco es forma, no texto.
<svg viewBox="0 0 100 100">
  <defs>
    <linearGradient id="ring-grad-load" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="var(--arc-load)" />
      <stop offset="100%" stopColor="var(--arc-load-2)" />
    </linearGradient>
    {/* sombra del sobregiro: marca el escalón de la segunda vuelta */}
    <filter id="ring-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="1.6" floodOpacity="0.45" />
    </filter>
  </defs>
  <circle cx="50" cy="50" r="43" fill="none" strokeWidth="11"
          stroke="var(--arc-load)" strokeOpacity="0.2" />
  <circle cx="50" cy="50" r="43" fill="none" strokeWidth="11"
          stroke="url(#ring-grad-load)" strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 43}
          strokeDashoffset={(1 - Math.min(pct, 1)) * 2 * Math.PI * 43}
          transform="rotate(-90 50 50)" />
</svg>
```

`RingTrio` = tres radios (43 / 29.5 / 16) con grosor 11 y ~2.5 px de hueco, en un
`viewBox` de 100×100 que se escala con la prop `size`: 160 por omisión, 148 en el héroe
de Hoy, 132 en el resumen de sesión. El trío del calendario es otro componente,
`MiniRings`, con geometría propia, porque a 16 px los radios del grande se funden en una
mancha.

**`<MetricTile />`** — etiqueta arriba en mayúsculas del color del dato, valor
gigante tabular, unidad chica al lado.

```
┌──────────────────┐
│ CARGA            │  ← 12/600, color del dato
│ 4,280 KG         │  ← 32/700 tabular · unidad 15/600 en --muted
│ +8 % vs. semana  │  ← 13/400 --muted, con ↑ verde / ↓ rosa
└──────────────────┘
```

**`<StatGrid />`** — grid de 2 o 3 columnas de `MetricTile`. Hoy sólo lo usa Progreso:
el resumen de sesión y el detalle de rutina tienen cada uno su `Stat` local.

**`<GroupedList />` + `<Row />`** — una sola tarjeta con filas separadas por
hairline a partir de los 16 px de padding izquierdo (como los settings de iOS).
Sustituye a la lista de `Card` sueltas en Rutinas, Progreso y Perfil.

**`<BottomNav />`** — la nav flotante. El vidrio no es una prop sino la clase `.glass`
de `globals.css`, para que nav, hojas y HUD compartan la misma receta: ítem activo =
ícono relleno + label en `--accent` (sin píldora negra), y se encoge (label oculta) al
hacer scroll hacia abajo.

**`<PageHeader />`** — `eyebrow` en acento + large title 34/700 (`title`, `backHref`,
`right`, `subtitle`, `capitalize`). ⏳ El colapso a barra de vidrio al hacer scroll
quedó fuera.

**`<TrendPill />`** — "↑ 8 % vs. tus últimas 4 semanas".

**`<ConsistencyCalendar />` + `<MiniRings />`** (se planeó como `RingCalendar`) — el
heatmap pasa a una rejilla donde cada día es un trío de anillos en miniatura de 16 px.

**`<ExerciseThumb />`** — el escenario de los gifs del catálogo. Son de 180×180 con el
fondo blanco quemado: en vez de pelearse con eso se les da un recuadro blanco **plano**
(cualquier degradado delata el recuadro, porque el gif trae el suyo) con hairline
interior, la figura contenida con 4 % de aire y un esqueleto `animate-pulse` mientras
carga, nada de destello. En oscuro el contenedor entero baja a `brightness(.87)` —
atenuar sólo la imagen deja el relleno blanco y se ve un marco. Nunca se amplía más allá
de lo que aguanta la fuente: la hoja de detalle lo topa en 300 px, porque a ancho
completo en un iPhone eran 6.5×. Props: `aire` (margen interno) y `eager` (el héroe de
la hoja).

**`<LoadUnitPicker />`** — chip con la unidad del ejercicio (`KG ⌄`) que abre una hoja
con Kilos / Libras / Placas, cada una con una línea de cuándo usarla. Guarda en la rutina
(`setLoadUnit`), no en la sesión. Vive en el entrenamiento a propósito: la unidad se
decide parado frente al aparato, no armando la rutina. Cambiarla nunca reetiqueta el
historial —cada serie guarda su propia `weight_unit`— y el encabezado de la columna
cambia en el acto.

### 5.2 Actualizados

| Hoy | Cambia a |
|---|---|
| `Card` | radio 20, `bg-surface`, hairline en vez de sombra, sin sombra en oscuro |
| `PrimaryButton` | se queda píldora, pero altura fija 52 y `bg-primary`; variante `tone="accent"` rosa para "Empezar" |
| `Chip` | activo = `bg-accent text-white`; inactivo = `bg-surface-2 text-muted` |
| `Input` | radio 12, `bg-surface-2`, sin borde, foco = anillo `--accent` de 2 px |
| `SectionTitle` | pasa a `label` (12/600 mayúsculas `--muted`) cuando encabeza un grupo, y a 22/700 cuando es título de bloque |
| `SessionHud` | ver 6.4 |
| `SetRow` | ver 6.4 |
| `ExerciseProgressChart` / `BodyWeightChart` | sin grid, sin ejes visibles salvo 3 etiquetas, línea 3 px con degradado del color del dato, área al 12 %, tooltip = tarjeta oscura con radio 12 |
| `TrainingHeatmap` | borrado en `1bf4729`; lo sustituye `ConsistencyCalendar` |

---

## 6. Pantalla por pantalla

Esta sección es la **especificación** tal como se escribió antes de implementar, con los
bocetos en ASCII que guiaron el trabajo. Para saber cómo está hoy cada pantalla, la
fuente es §8 de [PLAN.md](./PLAN.md) y el código; esto se conserva porque explica el
porqué de cada decisión.

### 6.1 Home → "Resumen"

```
MARTES, 22 DE SEPTIEMBRE          ← 13/600 mayúsculas, --accent
Resumen                      (👤)  ← 34/700 + avatar 36px a la derecha

┌──────────────────────────────────────────┐
│                                          │   TARJETA HÉROE
│    ╭─────────╮    CARGA                  │   (la única con sombra)
│    │ ╭─────╮ │    4,280 / 5,000 KG       │
│    │ │ ╭─╮ │ │    SERIES                 │
│    │ │ │ │ │ │    42 / 60                │
│    │ │ ╰─╯ │ │    DÍAS                   │
│    │ ╰─────╯ │    3 / 4                  │
│    ╰─────────╯                           │
│                                          │
│  Semana del 21 al 27 · vas al 76 %    ›  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐   SI HAY SESIÓN ABIERTA:
│ ● EN CURSO · Espalda        28:14        │   sustituye al CTA de abajo,
│ [ Continuar ]              Descartar     │   borde rosa 1px + punto que late
└──────────────────────────────────────────┘

HOY TOCA
┌──────────────────────────────────────────┐
│ ▓▓▓▓  Pierna                             │
│ ▓▓▓▓  6 ejercicios · 18 series      [▶]  │   ▶ = botón circular rosa 56px
│       Última vez hace 4 días             │
└──────────────────────────────────────────┘

TUS RUTINAS                        Ver todas ›
┌──────────────────────────────────────────┐   GroupedList: una tarjeta,
│ ▓▓  Push Day        5 ej · 15 series  ›  │   filas con hairline
│ ─────────────────────────────────────────│
│ ▓▓  Espalda         7 ej · 21 series  ›  │
└──────────────────────────────────────────┘
```

Cambios de fondo: los dos stat-cards de "esta semana / racha" desaparecen —
esa información ya está en los anillos, con meta y todo. El pie de la tarjeta héroe
muestra **o** la racha ("🔥 5 semanas seguidas", cuando es ≥ 2 semanas) **o** el
porcentaje de la semana, nunca los dos.

### 6.2 Rutinas

Large title "Rutinas" + botón `+` circular a la derecha (el formulario "Nueva
rutina" se va a un bottom sheet, como ya hicimos con "Agregar ejercicio").
La lista pasa a `GroupedList` con thumb 44×44 redondo-cuadrado, nombre 17/600,
metadatos 13 en `--muted`, chevron `--faint`.

### 6.3 Detalle de rutina

```
‹ Rutinas
Pierna                                       ← title 34/700

┌──────────────────────────────────────────┐   TARJETA HÉROE de 3 stats,
│   6         18         4                 │   cada número en el color de su
│ EJERCICIOS  SERIES   MÚSCULOS            │   dato (días / series / carga)
└──────────────────────────────────────────┘

[ ▶  Empezar entrenamiento ]                 ← píldora rosa, 52px, en el flujo

EJERCICIOS
┌──────────────────────────────────────────┐
│ ▓▓  Sentadilla con barra                 │
│ ▓▓  4 × 10 · kg                    ⋮     │  ← ⋮ abre menú (editar/mover/quitar)
│ ─────────────────────────────────────────│
│ ▓▓  Prensa                               │
│ ▓▓  3 × 12 · placas                ⋮     │
└──────────────────────────────────────────┘

        [ + Agregar ejercicio ]              ← secundario, abre hoja
        Ajustes de la rutina (nombre, días, duplicar, eliminar) al pie
```

### 6.4 Entrenar (la pantalla más importante)

El HUD deja de ser un bloque lavanda con tres relojes iguales y pasa a ser el
héroe negro/vidrio con **un** número dominante:

```
┌──────────────────────────────────────────┐  sticky, bg-surface + blur
│  ╭────╮                                  │
│  │ ◠  │        02:14                     │  ← 44/700 tabular. Es el descanso
│  ╰────╯     DESCANSO                     │     si está corriendo; si no, el
│  anillo de series                        │     tiempo transcurrido.
│                                          │
│  −15s      [ Saltar ]      +15s          │
│  ─────────────────────────────────────── │
│  28:41 TRANSCURRIDO    12/18 SERIES      │  ← 15/600 tabular, --muted
└──────────────────────────────────────────┘
```

- El anillo de la izquierda (64 px) es el de **series de la sesión**, verde, con el
  porcentaje dentro y la etiqueta "Entrenando". Durante el descanso el trazo cambia a
  cian y cuenta hacia atrás —el temporizador *es* un anillo—, la etiqueta pasa a
  "Descanso" y **sólo entonces** aparecen los controles −15s / Saltar / +15s.
- Al terminar el descanso: vibración (`navigator.vibrate(200)`). ⏳ El rebote del anillo
  no existe todavía: quedó en la fase 6.

Fila de serie:

```
┌──────────────────────────────────────────┐
│ ▓▓▓ Sentadilla con barra                 │
│ ▓▓▓ ⟳ 4 × 10 reps        [ KG ⌄ ]        │  ← chip: abre la hoja de unidad
│                                          │
│ ↑ Sube a 62.5 kg               [ Usar ]  │
│                                          │
│         KILOS            REPS            │  ← encabezado en --faint, sigue al chip
│  1   [ 60     ] [ 10     ]        ✓      │
│  2   [ 60     ] [ 10     ]        ✓      │
│  3   [ 62.5   ] [  8     ]        ○      │
│                          + Agregar serie │
└──────────────────────────────────────────┘
```

- Los inputs pasan a `bg-surface-2`, radio 12, **texto 20/600 tabular
  centrado** (hoy son 15 px: se teclea con el pulgar, tienen que ser grandes).
- La vez pasada entra como **placeholder** de los campos, en `--faint` ("60 kg" /
  "10 reps"): se lee como sugerencia y desaparece al teclear, sin robar una línea por
  fila. ⏳ Pendiente: una etiqueta "ANTES 60×10" encima de la fila, para que el dato
  siga visible mientras se escribe.
- Serie completada: fondo `color-mix(in srgb, var(--ring-sets) 10%, transparent)`, check
  relleno. Serie en cola offline: fila y check en `--warning` con ícono de nube tachada.
  ⏳ Falta el texto "EN COLA": hoy el ámbar sólo se explica en el `aria-label` y en el
  `title`, y el color solo no basta (§10).

Al terminar: **pantalla de resumen** (ver 7.3) en vez de saltar directo a la
lista de sesiones.

### 6.5 Progreso

```
Progreso                                     ← large title
[ Semana | Mes | Año ]   ← segmented control opaco (bg-surface-2, píldora activa bg-surface + shadow-hero); el vidrio se reserva a nav, hojas y HUD (principio 7)

┌──────────────────────────────────────────┐
│ TENDENCIA                                │
│ ↑ 12 %                                   │  ← 32/700, verde si sube
│ Levantaste más carga que tus últimas 4   │
│ semanas.                                 │
└──────────────────────────────────────────┘

┌──────┐┌──────┐┌──────┐┌──────┐             ← StatGrid 2×2
│SESIO.││SERIES││CARGA ││TIEMPO│
│  12  ││  148 ││18.4t ││ 9h12 │
└──────┘└──────┘└──────┘└──────┘

DÍAS ENTRENADOS
┌──────────────────────────────────────────┐
│  L  M  M  J  V  S  D                     │
│  ◉  ◎  ◉  ·  ◉  ·  ·                     │  ← ConsistencyCalendar, 14 semanas
└──────────────────────────────────────────┘

POR EJERCICIO                     Ver todos ›
┌──────────────────────────────────────────┐
│ ▓▓ Sentadilla   PR 100 kg  ↑         ›   │  ← el PR como dato principal
│ ───────────────────────────────────────── │
│ ▓▓ Press banca  PR 70 kg   =         ›   │
└──────────────────────────────────────────┘

SESIONES
(GroupedList con fecha, rutina, y 3 métricas chicas por fila)
```

La consulta trae 16 semanas de historia (`getDailyTraining(userId, 16 * 7)`) pero el
calendario dibuja 14: es lo que cabe en un teléfono sin que el scroll horizontal se
vuelva incómodo.

**Cómo se lee el calendario**: la meta de cada día es la meta semanal **repartida entre
los días que te propusiste entrenar** (5,000 kg / 4 días = 1,250 kg por día). Así un
martes que cumplió su parte cierra sus anillos aunque la semana vaya a la mitad — que es
justo lo que uno quiere ver en una cuadrícula de constancia. El tercer anillo (días) es
binario: entrenaste o no. Los días futuros van al 15 % de opacidad.

### 6.6 Detalle de sesión

Copia directa de la tarjeta de entrenamiento de Fitness: cabecera con el nombre
de la rutina y la fecha, luego el grid de métricas con etiqueta arriba y valor
grande de color, luego las series agrupadas por ejercicio.

```
Pierna
Martes 17 de sep. · 19:04

TIEMPO TOTAL     CARGA TOTAL
1:04:22          4,280 KG
SERIES           EJERCICIOS
18               6
```

### 6.7 Perfil

`GroupedList` de settings al estilo iOS. Orden: tarjeta de usuario, **Apariencia**
(`ThemeSwitch`: Sistema / Claro / Oscuro, la misma píldora segmentada de Progreso),
**Metas de la semana** (los tres anillos, cada etiqueta en el color de su dato),
navegación, **Peso corporal** (tarjeta con gráfica arriba e historial abajo) y
contraseña. El tema no se guarda en la base: es por dispositivo. Lo aplica
`src/lib/theme-script.ts`, inyectado en `<head>` y ejecutado antes del primer pintado,
que pone `data-theme` en `<html>` y escribe el `<meta name="theme-color">` — por eso
`viewport.themeColor` ya no existe en `layout.tsx`: un meta por media query diría lo
contrario de lo que se ve.

### 6.8 Login / Registro

Fondo negro, logo/ícono arriba, campos `bg-surface-2` radio 12, botón píldora
blanco (oscuro) / negro (claro). Sin tarjeta contenedora.

---

## 7. Qué podemos poner que hoy no está

### 7.1 Anillos semanales con metas (el corazón del rediseño)

Apple usa metas **diarias**; para gym la unidad natural es la **semana**. Tres
anillos:

| Anillo | Métrica | Meta por defecto | Color |
|---|---|---|---|
| Carga | kg levantados en la semana (lb→kg convertido, placas fuera) | 5,000 kg | rosa |
| Series | series completadas en la semana | 60 | verde |
| Días | días distintos con sesión terminada | 4 | cian |

Todo se calcula con `set_logs` + `workout_sessions` que ya existen; sólo faltan
las metas (sección 8). Semana = lunes a domingo en `America/Mexico_City`
(`src/lib/dates.ts` ya lo hace).

### 7.2 Tendencias

Comparar los últimos 28 días contra los 28 anteriores por métrica (carga,
series, sesiones, tiempo) y mostrar `↑ 12 %` con una frase. Cero datos nuevos.

### 7.3 Resumen post-entrenamiento

Al tocar "Terminar entrenamiento", en vez de redirigir a la lista: una pantalla
a pantalla completa con los anillos de la semana **cerrándose en vivo**, el grid
de métricas de la sesión, y los PRs que hayas roto ("🏆 Nuevo récord: Sentadilla
100 kg"). Botones: "Listo" y "Compartir".

### 7.4 Récords personales (PR)

Ya tenemos los datos: `max(weight)` y `max(weight × reps)` por ejercicio. Falta
mostrarlos: badge en la lista de ejercicios, aviso al romperlo durante la
sesión, y una sección "Tus récords" en Progreso.

### 7.5 Premios / rachas

Calculados, sin tabla nueva: primera sesión, 7 días seguidos, 10 sesiones,
100 series en una semana, primer 100 kg, 4 semanas cerrando el anillo de días.
Carrusel horizontal de medallas con degradado del color de su categoría.

### 7.6 Compartir sesión

Canvas 1080×1350 generado en cliente con los anillos + métricas + nombre de la
rutina, y `navigator.share()` con el `File`. Es la feature que más hace que la
app "se sienta" como Fitness.

### 7.7 Mini-detalles con alto retorno

- Haptics (`navigator.vibrate`) al marcar serie, no sólo al acabar el descanso.
- Pull-to-refresh nativo respetado (`overscroll-behavior-y: contain` sólo en
  sheets).
- Splash screens de iOS (`apple-touch-startup-image`) para que al abrir desde
  la pantalla de inicio no destelle blanco.

---

## 8. Lo que sí toca la base de datos

Una sola migración, con el método que ya usa el proyecto (SQL a mano contra
Neon y luego `db:push` para verificar que no queda diferencia — ver notas de
infra en [PLAN.md](./PLAN.md)):

```sql
alter table users
  add column goal_weekly_volume_kg integer not null default 5000,
  add column goal_weekly_sets      integer not null default 60,
  add column goal_weekly_days      integer not null default 4;
```

Y el mismo cambio en `src/db/schema.ts` (que es la fuente de verdad). Nada más:
tendencias, PRs, premios y el resumen de sesión salen de `set_logs` y
`workout_sessions` tal como están.

Consulta nueva en `src/db/queries.ts`:

```ts
getWeeklyRings(userId, goals: { volumeKg; sets; days }) → {
  volumeKg: number; volumeGoal: number;
  sets: number;     setsGoal: number;
  days: number;     daysGoal: number;
  overall: number;  // promedio de los tres avances: el "vas al 76 %"
}
```

Las metas entran como argumento y no las lee la consulta: la página ya trajo el `user`,
y así la misma función sirve para Progreso, que reparte esas metas entre días para el
calendario. La racha no vive aquí: sigue en `getWeeklyStats`. El volumen convierte
`lbs`→kg con `toKg` (`src/lib/suggest.ts`) y deja las placas fuera.

---

## 9. Plan de implementación por fases

Cada fase es un commit que deja la app funcionando y se ve distinta al terminar.
Orden pensado para que el cambio se note desde la primera.

### Fase 0 — Tokens y tipografía ✅
- [x] Reescribir `globals.css` con la paleta de 4.1.
- [x] Cambiar Outfit → Inter en `layout.tsx`; actualizar `--font-outfit` → `--font-inter`.
- [x] `theme-color` `#f2f2f7` / `#000000` — al principio en `viewport.themeColor`, hoy
      lo escribe `themeScript` en el `<head>` para que siga al tema elegido y no al del
      sistema (ver §6.7).
- [x] Ajustar `ui.tsx`: `Card`, `PrimaryButton`, `SecondaryButton`, `Chip`, `Input`, `SectionTitle` a los valores de 4.3.
- **Hecho cuando**: la app entera se ve negra/gris neutra sin tocar ni una pantalla, y `npm run build` pasa.

### Fase 1 — Navegación y cabeceras ✅
- [x] `BottomNav` de vidrio (blur + saturate, activo en `--accent`, íconos rellenos) que
      esconde las etiquetas al hacer scroll hacia abajo.
- [x] `PageHeader` con large title de 34 px y `eyebrow` en acento (la fecha en Hoy,
      "Entrenamiento terminado" en el resumen). ⏳ El colapso a barra de vidrio al
      hacer scroll quedó fuera: pedía un `IntersectionObserver` en cada pantalla.
- **Hecho cuando**: las 7 pantallas tienen large title y la nav flota en vidrio.

### Fase 2 — Anillos ✅
- [x] Migración de metas (sección 8) aplicada a Neon + `schema.ts`.
- [x] `getWeeklyRings` en `queries.ts` (cuenta también la sesión en curso).
- [x] `Ring`, `RingTrio`, `RingLegend`, `MiniRings` en `components/Rings.tsx`;
      `MetricTile`, `StatGrid`, `GroupedList`, `TrendPill` en `ui.tsx`.
- [x] Home rediseñada (6.1): héroe de anillos, "Hoy toca", `GroupedList` de rutinas.
- [x] Metas editables en Perfil (`updateGoals`).
- **Hecho cuando**: abres la app y lo primero que ves son tus tres anillos de la semana.

### Fase 3 — Entrenar ✅
- [x] `SessionHud` nuevo: vidrio, un número dominante y el anillo de series que se
      vuelve cian y cuenta regresivo durante el descanso.
- [x] `SetRow` con campos de 20 px, fila verde al completar, ámbar en cola y haptic.
- [x] Menú `⋮` (`ExerciseRowMenu`) en el detalle de rutina, en vez de tres botones.
- **Hecho cuando**: se puede loguear una sesión completa a una mano sin hacer zoom.

### Fase 4 — Progreso ✅
- [x] Segmented control semana/mes/año (`?r=7|30|365`).
- [x] Tarjeta de tendencia + `StatGrid` de totales del periodo.
- [x] `ConsistencyCalendar`: 14 semanas de tríos de anillos en miniatura.
- [x] Gráficas de Recharts con el color del dato, sin grid y con trazo de 3 px.
- [x] Récords personales (`getPersonalRecords`) en la lista por ejercicio.
- **Hecho cuando**: Progreso responde "¿voy mejor o peor?" sin abrir nada.

### Fase 5 — Cierre de sesión y premios 🟡 a medias
- [x] Al terminar, la app va al resumen de la sesión (`?done=1`) con los anillos de la
      semana ya actualizados, el grid de métricas y un botón "Listo".
- [ ] ⏳ Aviso de PR *durante* la sesión (el récord ya se ve en Progreso).
- [ ] ⏳ Carrusel de premios.
- [ ] ⏳ Compartir sesión como imagen.
- **Hecho cuando**: terminar un entrenamiento se siente como un logro.

### Fase 6 — Pulido 🟡 a medias
- [x] Haptic al marcar serie; `prefers-reduced-motion` global en `globals.css`.
- [x] `npm run smoke` verde y actualizado a los selectores nuevos (9/9).
- [ ] ⏳ Splash screens de iOS (`apple-touch-startup-image`). Los skeletons ya están,
      pero sólo en las imágenes (`ExerciseThumb`): faltan en las listas que hoy saltan
      al cargar.
- [ ] ⏳ El resto del paso de accesibilidad de la sección 10 (focus visible en todo lo
      enfocable, `aria-labelledby` de las hojas).
- [ ] ⏳ CTA "Empezar entrenamiento" sticky al pie en rutinas largas, con
      `env(safe-area-inset-bottom)`: hoy hay que hacer scroll de vuelta hasta arriba.
- [ ] ⏳ `getDailyTraining` pide 16 semanas y `ConsistencyCalendar` dibuja 14 (`WEEKS`):
      dos semanas de datos que se traen y se tiran. Una sola constante.
- [ ] ⏳ Al cerrar el descanso, el anillo rebota (`.animate-pop`): hoy sólo vibra, y con
      el teléfono en el suelo eso no se ve.

> Al cerrar cada fase: fila nueva en la tabla de cambios de
> [PLAN.md](./PLAN.md) con el hash del commit, como se viene haciendo.

---

## 10. Accesibilidad y detalles finos

- **Contraste**: texto sobre `--surface` ≥ 4.5:1. Por eso el verde y el cian
  cambian de valor entre modos (4.1). Verificar `--muted` al 60 % sobre
  `#1c1c1e` (pasa, 7.3:1) y sobre `#fff` (pasa, 4.6:1).
- **Nunca sólo color**: la serie completada lleva check *y* fondo; la tendencia
  lleva flecha *y* signo; el anillo lleva número al lado.
- **Objetivos táctiles** de 44 px en check de serie, `⋮`, chevrons y nav.
- **`prefers-reduced-motion`**: los anillos aparecen en su valor final, sin
  barrido; nada de `scale` en taps.
- **Zoom**: seguir sin `maximumScale` (ya se arregló, no reintroducirlo).
- **Labels**: hecho en `SetRow` — cada campo lleva `aria-label` con el número de serie y
  la unidad ("Peso serie 3 (kg)", "Placas serie 3", "Repeticiones serie 3"), y el botón
  de marcar cambia de etiqueta según el estado. Lo que sigue abierto es el focus trap y
  el `aria-labelledby` de las hojas: `ExerciseInfoSheet` tiene `role="dialog"` y
  `aria-modal` pero su nombre accesible está en el botón que la abre, no en la hoja.
  Faltan también los campos de `SetRowEditor` y `ExerciseTargetsEditor`.
- **Focus visible**: anillo `--accent` de 2 px en todo lo enfocable, que hoy
  sólo tienen los `Input`.
- **Safe areas**: `env(safe-area-inset-bottom)` ya está en la nav y en las hojas.

---

## 11. Qué NO copiar de Apple

Esto es "inspirado en", no un clon. Límites conscientes:

- **SF Pro no se usa** (licencia restringida a plataformas Apple) → Inter.
- **No se copian los íconos de Apple** ni las medallas de Activity ni el ícono
  de la app de Fitness → `lucide-react` + medallas propias.
- **No se llaman "Move / Exercise / Stand"** ni se usa la palabra "anillos de
  actividad" como marca → Carga / Series / Días.
- **Nada de Fitness+**: no hay biblioteca de videos, ese carrusel no aplica.
- **Métricas que no tenemos, no se inventan**: sin calorías ni frecuencia
  cardiaca. Si algún día hay integración con Health, se agregan; mientras, las
  métricas son las nuestras (carga, series, días, tiempo).
- **Liquid Glass con moderación**: sólo nav, sheets y el HUD. El contenido es
  opaco, como manda la propia guía de Apple.

---

## 12. Fuentes

- [Activity rings — Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/activity-rings)
- [Track daily activity with Apple Watch — Apple Support](https://support.apple.com/guide/watch/track-daily-activity-apd3bf6d85a6/watchos)
- [Apple Fitness — Wikipedia](https://en.wikipedia.org/wiki/Apple_Fitness)
- [Apple Fitness iOS Summary Screen — Mobbin](https://mobbin.com/explore/screens/f8ca0d70-c83d-41de-94d0-2c45cd3c266d)
- [Apple Fitness UI blueprint — Spectr](https://www.spectr.to/gallery/apple-fitness)
- [iOS 26 Design Guidelines: Illustrated Patterns — Learn UI Design](https://www.learnui.design/blog/ios-design-guidelines-templates.html)
- [Visualize Apple Watch Activity in React — @lachlanjc/notebook](https://notebook.lachlanjc.com/2021-03-18_visualize_apple_watch_activity_in_react) (valores hex de los anillos)
- [The details of UI typography — WWDC20](https://developer.apple.com/videos/play/wwdc2020/10175/)
- [Meet the expanded San Francisco font family — WWDC22](https://developer.apple.com/videos/play/wwdc2022/110381/)
- [Build a UIKit app with the new design — WWDC25](https://developer.apple.com/videos/play/wwdc2025/284/)
- [Apple Watch — Close Your Rings](https://www.apple.com/watch/close-your-rings/)

---

## 13. Bitácora

Registro de lo que de verdad se subió, en orden. El detalle por commit vive en
la tabla de cambios de [PLAN.md](./PLAN.md); aquí queda el porqué.

### 2026-09-22 — El rediseño sale a producción

| Commit | Qué |
|---|---|
| `1bf4729` | Fases 0 a 4 completas + el resumen post-entrenamiento de la fase 5 |
| `f4257e7` | Fila del changelog en PLAN.md |
| `acbac55` | Etiquetar "series" en el porcentaje chico de la tarjeta de tendencia |
| `16419ee` | Descartar entrenamiento pasa a hoja de acción |
| `acec7ac` | El copiado de gifs sale de Perfil y se va a /admin → "Mantenimiento" |
| `bd2c571` → `5894264` | Diagnóstico del respaldo de gifs: de "no funciona" a "el token llega vacío al runtime y el store es privado" |
| `eb485d0` | Las dos opciones para cerrarlo, escritas en PLAN.md |
| `3197c61` | PLAN.md: el estado actual pasa de pila de rondas a inventario de lo que hay hoy |

**Cómo se verificó** (no solo `npm run build`):

- `npm run smoke` en local y con `BASE_URL` apuntando a Vercel: 9/9 las dos veces.
  Hubo que actualizar dos selectores de la suite que el rediseño rompió ("Nueva
  rutina" ahora es un botón que abre una hoja; el check de serie pasó de
  `bg-primary` a `bg-sets`).
- Recorrido con Playwright con una cuenta desechable y datos sembrados, en claro
  y en oscuro, de Hoy / Rutinas / detalle de rutina / Entrenar / Progreso /
  detalle de sesión / Perfil / descartar. Las capturas se revisaron una por una;
  la cuenta se borra al final (`ON DELETE CASCADE`).

**Lo que se arregló por verlo ya desplegado, no antes:**

1. **El "+" salía dos veces en Rutinas.** `PageHeader` pintaba `right` en la fila
   del botón de volver *y* junto al título. Ahora la acción va arriba solo cuando
   hay `backHref`.
2. **La leyenda de los anillos se cortaba** ("7,200/5,00…"): la unidad se movió a
   la etiqueta ("CARGA (KG)") en vez de ir pegada al número.
3. **Dos porcentajes idénticos sin distinguir** en la tarjeta de tendencia: el
   grande es carga, el chico ahora dice "series".
4. **Descartar entrenamiento rompía la tarjeta de "En curso".** El bloque de
   confirmación se renderizaba dentro de la fila del botón Continuar, se salía de
   la tarjeta y el botón de confirmar quedaba cortado por el borde de la
   pantalla. Ahora es una hoja de acción desde abajo, igual desde Home que desde
   la sesión — que además es el patrón de iOS para acciones destructivas.
5. **Perfil explicaba plomería.** La tarjeta "Imágenes de ejercicios" le contaba
   al usuario de dónde salen los gifs y que hay un almacenamiento propio. Se fue
   a /admin → "Mantenimiento".

**Hallazgo al mover eso último**: el espejado de gifs a Vercel Blob **nunca ha
corrido**. Hay 0 copias de 1,500 gifs y 39 ejercicios ya usados en rutinas siguen
dependiendo del servidor externo. Se diagnosticó a fondo (token vacío en el
runtime + store privado que no sirve URLs públicas) y quedó como pendiente #1
en [PLAN.md](./PLAN.md), con las dos opciones para cerrarlo. No tiene que ver con
el rediseño: salió a la luz al tocar esa pantalla, y lo que lo mantuvo escondido
19 días fue que `mirrorExerciseGif` se traga los errores. Por eso /admin ahora
tiene un diagnóstico que prueba cada pieza por separado.

### 2026-09-22 (tarde) — Presentación de los gifs y selector de tema

- **Se probó 3D y se descartó** (`no llegó a commitearse`): el visor con three.js
  funciona y gira, pero no existe contenido de gimnasio gratis — el pack más
  grande del mercado son 134 animaciones, nadie vende 1,500 en glTF, y las
  animadas a mano sin cinemática inversa se ven mal. Medido además: el "3D pesa
  menos" era falso (los 19 kB eran post-brotli y Vercel no comprime `.glb`).
- **Los gifs se presentan, no se maltratan** (`452bdf8`): la hoja los estiraba a
  ancho completo (180 px → 390, o sea 6.5× en un iPhone). Ahora van en un
  escenario acotado a 300 px, con hairline, esqueleto de carga y atenuado en
  oscuro para que la lámina blanca no deslumbre. Nombres a dos líneas, filas más
  compactas, tarjetas del explorador limpias.
- **Selector de tema** (`28715f2`) (Sistema / Claro / Oscuro) en Perfil. El tema se aplica
  antes del primer pintado desde `<head>`; verificado que sobrevive a navegar y
  recargar, y que el `theme-color` de la barra de estado sigue al tema elegido y
  no al del sistema.

### 2026-09-22 (noche) — La unidad de carga se cambia entrenando (`f6667b9`)

Los datos lo dijeron: 73 de 73 ejercicios en `kg` y 171 de 171 series en `kg`.
La opción de libras y placas existía desde la octava ronda, pero vivía detrás de
tocar la línea de "N series · N reps" en la pantalla de la rutina. Nadie la
encontró. Ahora cada ejercicio del entrenamiento trae un chip con su unidad que
abre una hoja con las tres opciones y una línea que explica cuándo usar cada una.
Lección general: **una opción que sólo se puede cambiar lejos de donde se
necesita es una opción que no existe.**

### 2026-09-23 — El ícono de FiTME llega a producción (`5e9a18a`)

El ícono nuevo (el mark "FIT ME" amarillo y turquesa sobre negro, recortado de
`fitmeLogo.jpg` sin el subtítulo "Gym & Wellness Center", que no se lee a
32 px) se había hecho con el rebrand, pero sólo en local. Durante ese tiempo la
web publicada siguió con el **triángulo de Vercel** en `favicon.ico` (el que
trae el scaffold y nunca se había cambiado) y la **mancuerna lavanda** del
sistema visual anterior en `icon.png`. Nadie lo notó en la app porque dentro
de la PWA no se ve el favicon; se notó en la pestaña del navegador.

Lo que hubo que cuidar al subirlo: el service worker sirve `.png`, `.ico` y
el manifest **cache-first y con la misma URL**, así que cambiar el archivo no
basta; una PWA ya instalada seguiría mostrando la mancuerna indefinidamente.
Por eso el SW sube a `v5`, y al activarse borra la caché de assets vieja.
El ícono de la pantalla de inicio en iOS/Android puede seguir viejo hasta que
se quite la app y se vuelva a agregar: eso lo decide el sistema operativo, no
el SW.

### Decisiones que conviene no volver a discutir

- **Inter, no SF Pro**: la licencia de SF Pro solo cubre plataformas Apple.
- **Verde y cian cambian de valor entre modo claro y oscuro**: los vivos de Apple
  (`#92E82A`, `#1EEAEF`) dan ~1.7:1 sobre blanco, ilegibles. El *arco* sí usa el
  color vivo en los dos modos, porque es una forma y no texto.
- **El volumen no cuenta placas**: no hay forma honesta de convertir "3 placas" a
  kilos. Las libras sí se convierten a kg antes de sumar.
- **Los anillos cuentan la sesión abierta**: tienen que moverse mientras
  entrenas, no al terminar.
- **El tema es una preferencia del usuario, no solo del sistema**: vive en `localStorage`
  (`workout:tema`) y se aplica con `data-theme` antes de pintar. No se guarda en la base
  porque es por dispositivo, no por cuenta — con la consecuencia de que **cerrar sesión
  lo borra**, porque `LogoutButton` barre todas las claves `workout:*`. En un teléfono
  compartido está bien; si algún día molesta, el arreglo es sacar el tema de ese prefijo,
  no dejar de purgar.
- **Las metas viven en `users`, no en una constante**: 5,000 kg / 60 series /
  4 días son solo el arranque, y cada quien las ajusta en Perfil.
