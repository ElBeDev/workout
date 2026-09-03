# Plan: App Web de Ejercicio (mobile-first) — estilo TrainWise

## 1. Visión

Web app optimizada para celular (PWA) para llevar el gym de forma digital:

- Ver y armar **rutinas** de ejercicio.
- Cada ejercicio con **video/gif de ejemplo** de cómo se hace.
- **Modo entrenamiento**: seguir la rutina en vivo, marcando series.
- Registrar **peso usado y repeticiones** por serie (con el peso de la vez anterior como referencia).
- Ver **progreso histórico** por ejercicio (gráficas de peso/reps en el tiempo).

## 2. Referencias investigadas

| App | Qué hace bien | Qué tomar de ejemplo |
|---|---|---|
| **TrainWise Fit / TrainWise App** | Programas estructurados, tutoriales de ejercicios (100+), check-ins, seguimiento de progreso | Estructura de "programas" con sesiones semanales |
| **Strong** | Interfaz rápida y sin distracciones para loggear series, rest timer | UX de logueo de series (referencia #1 a copiar) |
| **Fitbod** | Sugiere peso/reps automáticamente en base a lo que hiciste antes (progressive overload) | Auto-sugerencia de peso basada en el último registro |
| **Jefit** | 1400+ ejercicios con demo en video/gif | Catálogo de ejercicios con filtro por músculo/equipo |
| **Setgraph** | Enfocado 100% en trackear fuerza y progreso | Gráficas simples de progreso por ejercicio |

Conclusión: el patrón ganador es **"planner + tracker"**: armas la rutina una vez, y cada sesión solo entras a "ejecutarla" registrando peso/reps, con el dato anterior siempre visible como referencia para saber si subiste, bajaste o quedaste igual.

## 3. Features — MVP (fase 1)

1. **Auth simple** (login con email/Google) — 1 solo usuario o multiusuario básico.
2. **Catálogo de ejercicios**
   - Nombre, músculo objetivo, equipo necesario, gif/video demo, instrucciones cortas.
   - Se puede alimentar de una API pública (ver sección 5) en lugar de armar el catálogo a mano.
3. **Rutinas (armar/editar)**
   - Crear rutina con nombre (ej. "Push Day", "Piernas").
   - Agregar ejercicios a la rutina, definir series objetivo, reps objetivo, y opcional peso objetivo.
   - Reordenar / eliminar ejercicios.
   - Puede haber varias rutinas y organizarlas por día de la semana o por "programa" (ej. rutina de 4 días).
4. **Modo entrenamiento (ejecutar rutina)**
   - Entras a la rutina del día, ves el primer ejercicio con su gif.
   - Por cada serie: input rápido de **peso** y **reps**, botón "listo" para marcar la serie.
   - Se muestra automáticamente lo que hiciste la última vez en ese mismo ejercicio/serie (referencia para progressive overload).
   - Rest timer entre series (opcional pero muy usado).
   - Al terminar, la rutina queda guardada como "sesión completada" con fecha.
5. **Historial / progreso**
   - Por ejercicio: gráfica simple de peso máximo o volumen a través del tiempo.
   - Calendario/lista de sesiones completadas.

## 4. Features — fase 2 (nice to have)

- Sugerencia automática de peso/reps para la próxima sesión (progressive overload asistido).
- Notas por sesión ("me sentí cansado", "subí técnica").
- Body weight tracking (peso corporal, fotos de progreso).
- Compartir rutina con un link.
- Modo offline (PWA) para gimnasios sin señal.
- Recordatorios / notificaciones ("hoy toca pierna").

## 5. Videos/gifs de ejercicios — de dónde sacarlos

No hace falta grabar ni animar nada a mano, hay APIs/bases de datos gratis:

- **ExerciseDB** (https://github.com/exercisedb/exercisedb-api) — 11,000+ ejercicios, incluye gifs, target de músculo, equipo, instrucciones paso a paso. Versión gratis con ~1,500 ejercicios con gif, sin necesidad de API key.
- **WorkoutX** (https://workoutxapp.com/) — 1,400+ ejercicios con gif animado, filtrable por músculo/equipo, free tier 500 requests/mes.
- **wger** (open source, self-hosted) — base de datos abierta, buena si se quiere tener control total y correr el catálogo en nuestro propio servidor, pero sin gifs animados (solo imágenes estáticas en algunos casos).

**Recomendación**: arrancar con **ExerciseDB** para tener gifs desde el día 1 sin curar contenido manualmente; guardar en nuestra propia base de datos una copia/cache de los ejercicios que realmente se usen (evita depender de rate limits y permite agregar ejercicios custom del usuario después).

## 6. Modelo de datos (simplificado)

```
User
 └─ id, nombre, email

Exercise
 └─ id, nombre, músculo, equipo, gif_url/video_url, instrucciones

Routine
 └─ id, user_id, nombre, orden

RoutineExercise (ejercicio dentro de una rutina)
 └─ id, routine_id, exercise_id, orden, series_objetivo, reps_objetivo, peso_objetivo (opcional)

WorkoutSession (una ejecución real de la rutina)
 └─ id, user_id, routine_id, fecha, duración

SetLog (cada serie registrada durante la sesión)
 └─ id, session_id, exercise_id, numero_serie, peso, reps, completada
```

`SetLog` es la tabla clave: de ahí sale todo el historial y las gráficas de progreso.

## 7. Stack técnico sugerido

- **Frontend**: Next.js (React) + TypeScript + Tailwind CSS — mobile-first, con `next-pwa` para que sea instalable como app en el celular (PWA: ícono, splash screen, funciona sin abrir el navegador).
- **Backend/DB**: Supabase (Postgres + Auth + Storage) — resuelve login, base de datos y hosting de imágenes en un solo servicio, ideal para armar esto rápido sin levantar un backend aparte.
- **Gráficas de progreso**: Recharts.
- **Gifs/videos de ejercicios**: ExerciseDB (o cache local en Supabase Storage de los gifs más usados).
- **Deploy**: Vercel (integra directo con Next.js).

Esta combinación permite tener login, base de datos y PWA funcionando en celular sin manejar servidores propios.

## 8. Pantallas principales

1. **Home** — rutina de hoy / accesos rápidos a "Empezar entrenamiento".
2. **Mis rutinas** — lista de rutinas, botón "crear rutina".
3. **Editor de rutina** — agregar ejercicios (buscador con gif de preview), definir series/reps.
4. **Modo entrenamiento** — pantalla grande, un ejercicio a la vez, input de peso/reps por serie, gif visible, rest timer.
5. **Historial** — lista de sesiones pasadas + gráfica de progreso por ejercicio.
6. **Perfil** — datos del usuario, peso corporal (fase 2).

## 9. Roadmap sugerido

- **Semana 1**: setup del proyecto (Next.js + Supabase + PWA), modelo de datos, auth.
- **Semana 2**: catálogo de ejercicios (integración con ExerciseDB) + CRUD de rutinas.
- **Semana 3**: modo entrenamiento (logueo de series) + guardado de sesiones.
- **Semana 4**: historial + gráficas de progreso, pulir UX mobile, convertir a PWA instalable.

---

**Fuentes consultadas:**
- [TrainWise Fit App - App Store](https://apps.apple.com/us/app/trainwise-fit/id6448630653)
- [TrainWise App](https://www.trainwiseapp.com/)
- [Best Workout Tracker Apps For 2026 – Fitbod](https://fitbod.me/blog/best-workout-tracker-apps-for-2026/)
- [Best Workout Apps 2026 - JEFIT](https://www.jefit.com/blog/best-workout-apps-for-2026-top-7-options-tested-and-reviewed)
- [Setgraph: Best Progressive Overload App & Tracker (2026)](https://setgraph.app/articles/setgraph-the-best-workout-tracker-app-for-strength-training-and-progressive-overload)
- [ExerciseDB API (GitHub)](https://github.com/exercisedb/exercisedb-api)
- [WorkoutX - Exercise Database API with GIFs](https://workoutxapp.com/)
- [Build a full-stack app with Next.js and Supabase - LogRocket](https://blog.logrocket.com/build-full-stack-app-next-js-supabase/)
