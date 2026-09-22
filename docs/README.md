# Documentación de Workout

Todo lo escrito sobre la app vive aquí. El `README.md` de la raíz es sólo el
arranque rápido (instalar, correr, scripts).

| Documento | Qué contiene |
|---|---|
| [PLAN.md](./PLAN.md) | El plan maestro: estado actual, visión, modelo de datos, stack, pantallas, roadmap, mapa del código, notas de infra, registro de cambios por commit y la auditoría. **Es el documento vivo del proyecto**: cada ronda de trabajo agrega su fila a la tabla de cambios. |
| [diseno-apple-fitness.md](./diseno-apple-fitness.md) | El rediseño visual al estilo Apple Fitness: qué está mal hoy, cómo es Fitness de verdad, los tokens nuevos (color, tipografía, espaciado), los componentes, el rediseño pantalla por pantalla, las features que el estilo pide (anillos, tendencias, PRs, premios) y el plan por fases. |

## Convenciones

- Los documentos van en español, como el producto.
- Cambios de esquema: `src/db/schema.ts` es la fuente de verdad; el
  procedimiento (SQL a mano + `db:push` para verificar) está en las notas de
  infra de [PLAN.md](./PLAN.md).
- Al cerrar una tanda de trabajo, se agrega la fila correspondiente al registro
  de cambios de [PLAN.md](./PLAN.md) con el hash del commit.
