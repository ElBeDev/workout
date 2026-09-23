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
  // Admins can build routines for any user from /admin.
  isAdmin: boolean("is_admin").notNull().default(false),
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
