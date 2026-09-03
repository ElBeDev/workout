import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  // Nullable so the pre-auth placeholder row keeps working during the
  // switch to real accounts; enforced as required in the signup/login
  // actions instead of at the DB level.
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  email: text("email").unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    bodyPart: text("body_part"),
    equipment: text("equipment"),
    gifUrl: text("gif_url"),
    instructions: text("instructions"),
    externalId: text("external_id"),
  },
  (table) => [uniqueIndex("exercises_external_id_idx").on(table.externalId)]
);

export const routines = pgTable("routines", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const routineExercises = pgTable("routine_exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  routineId: uuid("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
  sortOrder: integer("sort_order").default(0).notNull(),
  targetSets: integer("target_sets").notNull(),
  targetReps: integer("target_reps").notNull(),
  targetWeight: numeric("target_weight"),
});

export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  routineId: uuid("routine_id").notNull().references(() => routines.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export const setLogs = pgTable(
  "set_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
    setNumber: integer("set_number").notNull(),
    weight: numeric("weight"),
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
  ]
);
