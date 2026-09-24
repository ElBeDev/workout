# Documentación de FiTME

Todo lo escrito sobre la app vive aquí. El `README.md` de la raíz es sólo el
arranque rápido (instalar, correr, scripts).

Si llegas nuevo: `../README.md` para arrancar, §0 de PLAN.md para saber qué hay hoy, §10
de PLAN.md para saber dónde está cada cosa, `mejoras-progreso.md` para lo que se está
haciendo ahora mismo, `siguiente-ronda.md` para la ronda anterior (6 de 7 hechos), y
diseno-apple-fitness.md sólo si vas a tocar la capa visual.

| Documento | Qué contiene |
|---|---|
| [PLAN.md](./PLAN.md) | El plan maestro: estado actual, visión, modelo de datos, stack, pantallas, roadmap, mapa del código, notas de infra, registro de cambios por commit y la auditoría. **Es el documento vivo del proyecto**: cada ronda de trabajo agrega su fila a la tabla de cambios. |
| [siguiente-ronda.md](./siguiente-ronda.md) | Lo que se está por hacer: descanso que sobrevive y suena, instrucciones en español, app bilingüe con selector, recordatorios, aviso de récord, migraciones versionadas. Con las decisiones ya tomadas y lo que queda bloqueado. Se vacía conforme se sube. |
| [mejoras-progreso.md](./mejoras-progreso.md) | La ronda activa: un bug de datos encontrado revisando la base (la duración de sesión sale corrupta en 1 de cada 4 sesiones reales — dos causas, ya diagnosticadas) más cuatro mejoras a la pantalla de Progreso (1RM estimado, cobertura muscular, tendencia de frecuencia, y una decisión pendiente sobre el selector de rango). |
| [natacion.md](./natacion.md) | Natación de verdad: rutinas `kind = 'natacion'` con sus propios bloques (`swim_blocks`/`swim_block_logs`) en vez de estirar el modelo de pesas. Fase 1 (MVP) hecha — tipo de rutina, editor de bloques, checklist al entrenar, tarjeta de distancia/ritmo en Progreso. Fase 2 (logueo por repetición, plantillas, SWOLF) sin empezar. |
| [rutinas.md](./rutinas.md) | El programa de rutinas que comparten todas las cuentas (contenido que vive en la base, no en el código): la semana, cada rutina ejercicio por ejercicio, las reglas del dueño para armarlas (sólo máquinas, bíceps y tríceps juntos, nada redundante), la excepción de Erika, y cómo se copió a todos sin desligar el historial — con el procedimiento para dárselo a un usuario nuevo. |
| [diseno-apple-fitness.md](./diseno-apple-fitness.md) | El sistema visual estilo Apple Fitness: la investigación, los tokens (color, tipografía, espaciado), los componentes, el rediseño pantalla por pantalla, las features que el estilo pide (anillos, tendencias, récords), el plan por fases con su estado, y una **bitácora** con lo que se subió, cómo se verificó y qué se arregló después de verlo en el teléfono — más las tandas posteriores al rediseño (gifs, tema, unidad de carga) y una lista de **decisiones que conviene no volver a discutir** (Inter y no SF Pro, el verde cambia de valor entre modos, el volumen no cuenta placas, el tema es por dispositivo y no por cuenta). |
| [../README.md](../README.md) | Arranque rápido: instalar, correr, scripts, base de datos. |
| [../AGENTS.md](../AGENTS.md) | Reglas para agentes. La importante: **esta versión de Next.js no es la que conoces** — antes de escribir código hay que leer la guía que toque en `node_modules/next/dist/docs/`. Lo escribe `next dev`, no se borra. |

## Convenciones

- Los documentos van en español, como el producto.
- **Cada tanda de trabajo deja registro**: una fila en el changelog de
  [PLAN.md](./PLAN.md) con el hash del commit, y — si tocó el diseño — una
  entrada en la bitácora de
  [diseno-apple-fitness.md](./diseno-apple-fitness.md#13-bitácora) explicando
  el porqué, no solo el qué.
- Lo que se descubre y no se arregla en el momento se anota como pendiente
  (sección 9 de PLAN.md) en vez de quedarse en la cabeza de alguien.
- Cambios de esquema: `src/db/schema.ts` es la fuente de verdad; el
  procedimiento (SQL a mano + `db:push` para verificar) está en las notas de
  infra de [PLAN.md](./PLAN.md).
- Nada se da por bueno con que compile: la referencia es `npm run smoke`
  (9 pruebas, cuenta desechable) corriendo también contra producción con
  `BASE_URL=https://workout-eight-neon.vercel.app`.
