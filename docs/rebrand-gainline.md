# Rebrand: de FiTME a GainLine, por ElBeFit (Decimoquinta)

Estado: **en producción** desde `4931c48` (2026-10-13), verificado. Sólo
falta que cada usuario de iPhone reinstale el acceso (§5).

## 1. Por qué

La app se renombró a FiTME en la Undécima (2026-09-23) porque se estaba
armando para ese gimnasio. El trato no se concretó: FiTME no pagó, así que
la app deja de ser suya y pasa a ser un producto personal del dueño.

Quedan dos nombres, y cada uno tiene su papel:

- **ElBeFit es quien la hace.** La empresa del dueño es **ElBe** y cada
  línea lleva su nombre: **ElBeGames** para videojuegos y **ElBeFit** para
  fitness. Aparece como firma ("Hecho por ElBeFit"), igual que un estudio.
- **GainLine es la app.** Se escribe con la L mayúscula para que las
  iniciales sean **GL**, que es lo que lleva el ícono. La *gain line* es la
  línea que hay que cruzar para avanzar, y en el ícono es literalmente la
  línea verde bajo las letras.

Cómo se eligió el nombre: se buscaron en la web y en el App Store varios
nombres en inglés. HeavySet, RepRise, Loadout, Brawn, PlateUp, Repwell y
SetWell ya son apps de entrenamiento. Para GainLine no apareció ninguna
(lo más parecido son GAIN Fitness, Gainify y Gainflow). Una búsqueda web
**no sustituye** revisar App Store, Google Play y el IMPI antes de
publicarla en tiendas o registrar la marca. El dueño lo dejó claro: "total
después se puede cambiar".

Grafías: **GainLine** y **ElBeFit** en todo lo visible; `gainline` en
identificadores técnicos (`package.json`).

## 2. El ícono y la firma

Los dos salen del mismo sistema que la firma de ElBe Games en Omeyocan
(`Omeyocan/game/tools/splash.gd` y su `docs/32-menu-inicio-y-carga.md` §4.0),
para que las líneas de ElBe se vean como familia:

| | ElBe Games | GainLine / ElBeFit |
|---|---|---|
| Letra principal | Barlow Condensed ExtraBold | la misma |
| Color de la letra | blanco hueso `#f4f1ea` | el mismo |
| Fondo | negro | negro (también es el del `manifest` y el modo oscuro) |
| Línea de acento | ocre `#e0aa3e`, el de Omeyocan | verde `#92E82A`, el de los anillos de series (`--ring-sets` en oscuro, `globals.css`) |
| Subtítulo | "GAMES" en Barlow Semi Condensed SemiBold, espaciado, gris `#8d8a84` | "FIT", igual |

- **El ícono de la app** (`docs/marca/gainline-1024.png`) es "GL" con la
  línea verde debajo. Se probó en miniatura (32 y 64 px) y contra una
  máscara circular: se lee en los dos casos.
- **La firma del estudio** (`docs/marca/elbefit.png`) es la de ElBe Games
  con "FIT" en lugar de "GAMES" y la línea en verde, incluida la «l» alzada
  para que no se lea «EIBe». La imagen sólo vive en `docs/marca/`. Dentro
  de la app, la firma es texto: "Hecho por" en Inter y la palabra con
  [ElBeFit.tsx](../src/components/ElBeFit.tsx), que usa la misma Barlow
  (`next/font/local`) y alza la «l» con CSS. Se intentó primero la «l» con
  colita de Inter (`cv05`), pero la Inter de Google Fonts no la trae.

Todo se regenera con un comando (requiere ImageMagick 7):

```sh
zsh scripts/marca/generar.sh
```

`scripts/marca/` tiene `icon.sh` (el ícono), `studio.sh` (la firma), Barlow
Semi Condensed SemiBold (para "FIT") y `generar.sh`, que
escribe los 6 íconos de la app y los dos archivos de `docs/marca/`. Si el
ícono cambia, basta con correrlo de nuevo y subir la versión del SW
(paso 3). Barlow Condensed ExtraBold vive en `src/fonts/` porque también la
usa la app; los scripts la leen de ahí. Las dos fuentes se copiaron de
Omeyocan (licencia OFL).

## 3. Qué se cambió

### Paso 1: el nombre

| Archivo | Cambio |
|---|---|
| [src/app/layout.tsx](../src/app/layout.tsx) | `title` y `appleWebApp.title` en `"GainLine"`, y el comentario con la historia del nombre |
| [src/app/manifest.ts](../src/app/manifest.ts) | `name` y `short_name` |
| [src/app/login/page.tsx](../src/app/login/page.tsx) | El `<h1>`, y la firma "Hecho por ElBeFit" al pie |
| [src/app/registro/page.tsx](../src/app/registro/page.tsx) | La firma al pie |
| [src/i18n/es/acceso.ts](../src/i18n/es/acceso.ts) / [en](../src/i18n/en/acceso.ts) | `hechoPor`: "Hecho por" / "Made by" (la marca no se traduce) |
| [src/app/perfil/push-actions.ts](../src/app/perfil/push-actions.ts) | Título del aviso de prueba |
| [public/sw.js](../public/sw.js) | Título por defecto de los avisos push y el comentario de arriba |
| [src/i18n/es/retos.ts](../src/i18n/es/retos.ts) / [en](../src/i18n/en/retos.ts) | "La comunidad GainLine" / "The GainLine community" |
| [src/app/api/export/route.ts](../src/app/api/export/route.ts) | El CSV se descarga como `gainline-<fecha>.csv` (antes `workout-…`) |

El recordatorio diario del cron toma su título del diccionario
(`recordatorioTitulo`), que nunca dijo FiTME.

### Paso 2: los íconos

Los 6 archivos se reemplazaron con los mismos nombres y tamaños, así que ni
`manifest.ts` ni `layout.tsx` cambian de rutas:

| Archivo | Tamaño |
|---|---|
| `src/app/favicon.ico` | 16, 32 y 48 px en un solo `.ico` |
| `src/app/icon.png`, `public/icon-512.png` | 512 px (el segundo también sale en Login y Registro) |
| `public/icon-192.png` | 192 px |
| `public/apple-touch-icon.png` | 180 px, sin transparencia |
| `public/icon-maskable-512.png` | 512 px, con "GL" más chico para que quepa en el círculo del 80 % de Android |

`fitmeLogo.jpg`, el logo de FiTME, se quitó del repo. Sigue en el historial
de git, pero ya no en el árbol.

### Paso 3: la caché

El SW pasa a `v6` y `PAGE_CACHE` de
[Connectivity.tsx](../src/components/Connectivity.tsx) a `pages-v6`, juntos.
Los íconos se sirven primero desde la caché y con la misma URL: sin el
cambio de versión, una PWA instalada seguiría mostrando el de FiTME.

### Paso 4: los textos de "gimnasio"

La app ya no es la de un gimnasio en particular. "Retos del gimnasio" pasa
a "Retos" (en inglés, "Gym challenges" pasa a "Challenges"). El panel del
coach, el ranking y los retos siguen igual: funcionan para cualquier grupo
con un coach. Los comentarios del código y `src/db/gym.ts` se quedan como
están porque no se ven.

### Paso 5: identificadores

`package.json` y `package-lock.json` quedan con `"name": "gainline"`. El
lockfile seguía en `"workout"` desde antes de FiTME.

### Paso 6: la documentación

- Los encabezados de [README.md](../README.md), [docs/README.md](./README.md),
  [rutinas.md](./rutinas.md) y [diseno-apple-fitness.md](./diseno-apple-fitness.md)
  dicen GainLine.
- [coach-y-retos.md](./coach-y-retos.md) ya no dice "la app de un gimnasio",
  sino "una app con coach y comunidad".
- [PLAN.md](./PLAN.md) tiene la entrada **Decimoquinta** y su línea en el
  roadmap. La fila del registro de cambios se agrega con el hash cuando se
  suba. Lo histórico (Undécima a Decimotercera) no se toca, porque cuenta lo
  que pasó en su momento.
- Este documento está en la tabla de [docs/README.md](./README.md).

### Paso 7: la base de datos ✅

Se buscó "fitme" / "fit me" (sin importar mayúsculas) en producción: en los
títulos de los retos, los comentarios del coach, los nombres de rutina, las
notas de sesión y los ejercicios. No apareció en ningún lado.

### Paso 8: verificar y subir ✅

1. ✅ `npm run lint` y `npm run build` sin errores.
2. ✅ `npm run smoke` en local, 10/10. Revisado también con capturas: el
   manifest y el `<title>` dicen GainLine, `sw.js` dice `v6`, y Login se
   ve bien en claro y en oscuro.
3. ✅ Commit `4931c48` y push a `main`; Vercel lo publicó en unos 75 s.
4. ✅ En producción:
   - los 6 íconos coinciden byte a byte con los locales;
   - `<title>` y manifest dicen GainLine, `sw.js` dice `v6` y Login muestra
     "Hecho por ElBeFit";
   - `npm run smoke` contra producción dio 10/10.

   `apple-touch-icon.png` salió distinto en la primera petición, porque el
   edge todavía tenía el viejo en caché, y en la siguiente ya coincidía.
5. Falta revisarlo en un teléfono de verdad: el ícono en la pantalla de
   inicio y un aviso de prueba desde Perfil.

## 4. Lo que queda abierto

- **El dominio.** `workout-eight-neon.vercel.app` sigue funcionando. Un
  dominio propio (algo como `gainline.app`) sería un paso aparte: comprarlo,
  apuntar los DNS a Vercel, y actualizar el `BASE_URL` del smoke y los docs.
- **El deck de FiTME** (Duodécima). Es un artifact privado de Claude con la
  marca de FiTME. No se ha tocado: el dueño decide si se borra o si se
  rehace como deck de GainLine.
- **La marca registrada.** Antes de subirla a tiendas, revisar GainLine en
  App Store, Google Play y el IMPI (ver la §1).

## 5. Lo que va a notar cada usuario

- **Dentro de la app**, todo cambia en cuanto el SW `v6` se activa: el
  título, el ícono en Login y Registro, y las notificaciones.
- **En la pantalla de inicio del iPhone**, el nombre y el ícono **no se
  actualizan solos**. iOS los toma una sola vez, cuando se agrega la app.
  Para ver GainLine, cada usuario tiene que borrar el acceso y volverlo a
  agregar desde Safari. Al hacerlo:
  - probablemente tenga que volver a iniciar sesión, porque la PWA de iOS
    guarda sus cookies aparte;
  - tendrá que volver a activar los recordatorios en Perfil, porque la
    suscripción push es de esa instalación.
- **En Android (Chrome)**, el ícono y el nombre se actualizan solos a los
  pocos días, cuando Chrome vuelve a leer el manifest.

Son 7 cuentas (bener, karizmendi@grupoargue.com, erika gordillo, karlaarizmendi, reberodriguez, andicicero, chely): conviene avisarles directamente con estas instrucciones.

## 6. Lo que no cambia

- La URL, la base de datos, los usuarios, las rutinas y el historial.
- La paleta y el diseño de la app (`globals.css`). El verde del ícono ya
  era de la app.
- Nombres internos como `src/db/gym.ts`.
- Las entradas históricas de PLAN.md.
