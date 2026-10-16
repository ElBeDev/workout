import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  date,
  uniqueIndex,
  index,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Nullable so the pre-auth placeholder row keeps working during the
  // switch to real accounts; enforced as required in the signup/login
  // actions instead of at the DB level.
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  email: text("email").unique(),
  name: text("name"),
  // El dueño de la plataforma (sólo bener): ve a todos los coaches en /admin.
  // Antes de la Decimoséptima era "el coach"; ahora el coach es `role`.
  isAdmin: boolean("is_admin").notNull().default(false),
  // "member" (entrena) o "coach" (además tiene alumnos y paga un plan, con su
  // fila en `coaches`). Ver docs/coaches.md §3.
  role: text("role").notNull().default("member"),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  // Metas semanales de los tres anillos del Resumen (carga / series / días).
  goalWeeklyVolumeKg: integer("goal_weekly_volume_kg").notNull().default(5000),
  goalWeeklySets: integer("goal_weekly_sets").notNull().default(60),
  goalWeeklyDays: integer("goal_weekly_days").notNull().default(4),
  // Recordatorio de "hoy toca": el cron manda el aviso a esta hora (en
  // America/Mexico_City) los días que la persona tenga rutina asignada.
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  reminderHour: integer("reminder_hour").notNull().default(19),
  // Fecha local del último aviso enviado, para no mandar dos el mismo día.
  reminderLastSent: date("reminder_last_sent"),
  // Cómo te ven los demás en Retos. No es `name`: esa columna es heredada y
  // la de bener dice "Owner". Sin él, se muestra el usuario hasta la "@",
  // para que un usuario que es un correo no quede expuesto en el ranking.
  displayName: text("display_name"),
  // Salir del ranking y de las tablas de los retos (sigues viéndolos).
  showInRanking: boolean("show_in_ranking").notNull().default(true),
  // Cuándo se subió la foto de perfil (null = sin foto). Va en la URL de la
  // foto (`/api/avatar/<id>?v=…`) para que la caché larga se rompa al
  // cambiarla, sin tener que leer `user_avatars` en cada lista.
  avatarUpdatedAt: timestamp("avatar_updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("sessions_expires_idx").on(table.expiresAt)]
);

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    nameEs: text("name_es"),
    bodyPart: text("body_part"),
    equipment: text("equipment"),
    gifUrl: text("gif_url"),
    // Copy of the gif in our own Vercel Blob store (filled lazily); the app
    // prefers this over gif_url so we don't depend on static.exercisedb.dev.
    gifBlobUrl: text("gif_blob_url"),
    instructions: text("instructions"),
    // Traducción al español de los pasos, con el mismo formato "Step:N" para
    // que la hoja de "cómo se hace" los parta igual.
    instructionsEs: text("instructions_es"),
    externalId: text("external_id"),
    // Custom exercises belong to a user; catalog rows have user_id = null.
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    isCustom: boolean("is_custom").notNull().default(false),
    // "reps", "seconds", "hold" o "minutes" (src/lib/measure.ts). En los
    // tres por tiempo, set_logs.reps guarda el tiempo (minutos en "minutes",
    // segundos en los otros). Los "seconds" (estiramientos, rodillo) no suman
    // a series, carga, récords ni ranking; los "hold" (isométricos y cardio
    // corto) y "minutes" (cardio) sí suman series, pero no carga ni récords
    // (ver docs/rutinas.md §7).
    measure: text("measure").notNull().default("reps"),
  },
  (table) => [
    uniqueIndex("exercises_external_id_idx").on(table.externalId),
    index("exercises_user_idx").on(table.userId),
  ]
);

export const routines = pgTable("routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  // Weekdays this routine is planned for: 0 = domingo … 6 = sábado.
  days: integer("days").array().notNull().default([]),
  // "fuerza" o "natacion": decide si el contenido vive en routine_exercises
  // o en swim_blocks, y qué pantalla de entrenamiento usar. No cambia
  // después de creada (ver docs/natacion.md §1).
  kind: text("kind").notNull().default("fuerza"),
  // Quién la armó, si no fue el dueño: su coach ("De tu coach"). Null en las
  // que se hizo uno mismo y en todas las anteriores a la Decimoséptima.
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bodyWeights = pgTable("body_weights", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weight: numeric("weight").notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export const routineExercises = pgTable(
  "routine_exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
    sortOrder: integer("sort_order").default(0).notNull(),
    targetSets: integer("target_sets").notNull(),
    targetReps: integer("target_reps").notNull(),
    targetWeight: numeric("target_weight"),
    // "kg", "lbs", or "plates" — plate-stack machines without marked weights
    // log a plate count instead, and some equipment is only marked in lbs.
    loadUnit: text("load_unit").notNull().default("kg"),
  },
  (table) => [index("routine_exercises_routine_idx").on(table.routineId)]
);

/**
 * El plan de una rutina de natación: una secuencia de bloques (calentamiento,
 * serie principal, patada, drill, enfriamiento), cada uno con su propio
 * estilo, repeticiones, distancia y descanso — reemplaza a routine_exercises
 * cuando routines.kind = 'natacion'. Ver docs/natacion.md §2 sobre por qué no
 * se estiró el modelo de pesas en vez de esto.
 */
export const swimBlocks = pgTable(
  "swim_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    routineId: uuid("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    // 'calentamiento' | 'principal' | 'patada' | 'drill' | 'enfriamiento' | 'libre'
    label: text("label").notNull(),
    // 'libre' | 'dorso' | 'pecho' | 'mariposa' | 'combinado' | 'patada' | 'drill'
    stroke: text("stroke").notNull(),
    reps: integer("reps").notNull(),
    distanceMeters: integer("distance_meters").notNull(),
    restSeconds: integer("rest_seconds"),
    notes: text("notes"),
  },
  (table) => [index("swim_blocks_routine_idx").on(table.routineId)]
);

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // Nullable + SET NULL so deleting a routine keeps the session history.
    routineId: uuid("routine_id").references(() => routines.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
    notes: text("notes"),
  },
  (table) => [
    index("workout_sessions_user_finished_idx").on(table.userId, table.finishedAt),
    // At most one open session per routine per user (double-tap on "Empezar").
    uniqueIndex("workout_sessions_one_open_idx")
      .on(table.userId, table.routineId)
      .where(sql`finished_at is null`),
  ]
);

export const setLogs = pgTable(
  "set_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
    setNumber: integer("set_number").notNull(),
    weight: numeric("weight"),
    // Unit "weight" was logged in ("kg" or "lbs") — kept per set so a later
    // change to the exercise's default unit never relabels past history.
    weightUnit: text("weight_unit").notNull().default("kg"),
    // Alternative to weight for plate-stack machines.
    plates: integer("plates"),
    reps: integer("reps"),
    completed: boolean("completed").default(false).notNull(),
    loggedAt: timestamp("logged_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("set_logs_session_exercise_set_idx").on(
      table.sessionId,
      table.exerciseId,
      table.setNumber
    ),
    index("set_logs_exercise_idx").on(table.exerciseId),
  ]
);

/**
 * Lo que de verdad se nadó de cada bloque planeado — equivalente a set_logs,
 * pero por bloque en vez de por serie: en la alberca el teléfono no entra al
 * agua, así que el logueo real es "marqué el bloque hecho al salir", no
 * serie por serie en vivo (docs/natacion.md §0).
 */
export const swimBlockLogs = pgTable(
  "swim_block_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
    // Nullable + SET NULL: si el bloque planeado se edita o se borra después,
    // el log de lo que de verdad se nadó no se debe perder.
    swimBlockId: uuid("swim_block_id").references(() => swimBlocks.id, { onDelete: "set null" }),
    completed: boolean("completed").default(false).notNull(),
    actualReps: integer("actual_reps"),
    actualDistanceMeters: integer("actual_distance_meters"),
    actualSeconds: integer("actual_seconds"),
    loggedAt: timestamp("logged_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("swim_block_logs_session_block_idx").on(table.sessionId, table.swimBlockId),
    index("swim_block_logs_session_idx").on(table.sessionId),
  ]
);

/**
 * Lo que el coach (un admin) le escribe a un socio: suelto, o sobre una sesión
 * en particular. El socio lo ve en Hoy hasta que lo marca como leído, y los de
 * una sesión se quedan para siempre en el detalle de esa sesión.
 */
export const coachComments = pgTable(
  "coach_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // El socio al que va dirigido.
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // SET NULL: si se borra la cuenta del coach, lo que escribió no se pierde.
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    sessionId: uuid("session_id").references(() => workoutSessions.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("coach_comments_user_idx").on(table.userId, table.createdAt),
    index("coach_comments_session_idx").on(table.sessionId),
  ]
);

/**
 * Retos del gimnasio que arma el admin: una métrica, un rango de fechas
 * (locales, hora de México, ambos inclusive) y una meta por persona opcional.
 * Participa todo el que tenga `show_in_ranking`; el progreso no se guarda, se
 * calcula de `set_logs` / `swim_block_logs` igual que el ranking.
 */
export const challenges = pgTable("challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  // 'volume' (kg) | 'days' | 'sets' | 'distance' (m de natación)
  metric: text("metric").notNull(),
  goal: integer("goal"),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  // De qué grupo es el reto: el coach cuyos alumnos participan. Nullable sólo
  // porque la columna llegó con retos ya creados; todo reto nuevo lo lleva.
  coachId: uuid("coach_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // Un endpoint por navegador/dispositivo; único para que resuscribirse no
    // duplique filas.
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("push_subscriptions_user_idx").on(table.userId)]
);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/**
 * La foto de perfil, en la base y no en Blob (docs/gamificacion.md §5): el
 * teléfono la manda ya recortada a 256 × 256 en JPEG (unos 15 KB). Tabla
 * aparte para que leer `users` no arrastre imágenes.
 */
export const userAvatars = pgTable("user_avatars", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  image: bytea("image").notNull(),
  mime: text("mime").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ── Coaches (Decimoséptima, docs/coaches.md) ─────────────────────────── */

/**
 * Perfil y plan de cada coach: una fila por `users.role = 'coach'`. El estado
 * del plan lo escribe el webhook de Stripe, nunca una pantalla (§7).
 */
export const coaches = pgTable("coaches", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  // Para invitar: GL-7K3P (4 caracteres sin 0/O ni 1/I).
  code: text("code").notNull().unique(),
  // Nombre de su marca, el que ven sus alumnos al ligarse.
  brandName: text("brand_name"),
  accentColor: text("accent_color"),
  // "coach" (hasta 30 alumnos) | "coach_plus" (sin tope) | "comp" (gratis).
  plan: text("plan").notNull().default("coach"),
  // "trialing" | "active" | "past_due" | "locked" | "canceled".
  billingStatus: text("billing_status").notNull().default("trialing"),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEnd: timestamp("current_period_end"),
  // Desde cuándo falla el cobro: a los 7 días el panel se bloquea.
  pastDueSince: timestamp("past_due_since"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Alumno ↔ coach. Un alumno tiene a lo más un vínculo abierto (pendiente o
 * activo), y lo garantiza la base. Los terminados se quedan como historial.
 * Desligarse no borra nada del alumno: sólo le quita la vista al coach.
 */
export const coachClients = pgTable(
  "coach_clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coachId: uuid("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // "pending" (lo pidió el alumno) | "active" | "ended".
    status: text("status").notNull(),
    // "link" | "code" | "request" | "migration".
    source: text("source").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
    endedAt: timestamp("ended_at"),
    endedBy: uuid("ended_by").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [
    uniqueIndex("coach_clients_one_open_idx")
      .on(table.clientId)
      .where(sql`status in ('pending', 'active')`),
    index("coach_clients_coach_idx").on(table.coachId, table.status),
  ]
);

/** Eventos de Stripe ya procesados: Stripe puede mandar el mismo dos veces. */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});
