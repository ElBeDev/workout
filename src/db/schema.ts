import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
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
  restSeconds: integer("rest_seconds").notNull().default(90),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
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
    // Per-exercise rest override; null = the user's default.
    restSeconds: integer("rest_seconds"),
    // "kg" or "plates" — plate-stack machines without marked weights log a
    // plate count instead of kilograms.
    loadUnit: text("load_unit").notNull().default("kg"),
  },
  (table) => [index("routine_exercises_routine_idx").on(table.routineId)]
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
