# Documentación de Workout

Todo lo escrito sobre la app vive aquí. El `README.md` de la raíz es sólo el
arranque rápido (instalar, correr, scripts).

| Documento | Qué contiene |
|---|---|
| [PLAN.md](./PLAN.md) | El plan maestro: estado actual, visión, modelo de datos, stack, pantallas, roadmap, mapa del código, notas de infra, registro de cambios por commit y la auditoría. **Es el documento vivo del proyecto**: cada ronda de trabajo agrega su fila a la tabla de cambios. |
| [siguiente-ronda.md](./siguiente-ronda.md) | Lo que se está por hacer: descanso que sobrevive y suena, instrucciones en español, app bilingüe con selector, recordatorios, aviso de récord, migraciones versionadas. Con las decisiones ya tomadas y lo que queda bloqueado. Se vacía conforme se sube. |
| [diseno-apple-fitness.md](./diseno-apple-fitness.md) | El sistema visual estilo Apple Fitness: la investigación, los tokens (color, tipografía, espaciado), los componentes, el rediseño pantalla por pantalla, las features que el estilo pide (anillos, tendencias, récords), el plan por fases con su estado, y una **bitácora** con lo que se subió, cómo se verificó y qué se arregló después de verlo en el teléfono. |

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
