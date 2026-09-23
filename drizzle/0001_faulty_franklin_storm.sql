CREATE TABLE "swim_block_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"swim_block_id" uuid,
	"completed" boolean DEFAULT false NOT NULL,
	"actual_reps" integer,
	"actual_distance_meters" integer,
	"actual_seconds" integer,
	"logged_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swim_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"routine_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"stroke" text NOT NULL,
	"reps" integer NOT NULL,
	"distance_meters" integer NOT NULL,
	"rest_seconds" integer,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "kind" text DEFAULT 'fuerza' NOT NULL;--> statement-breakpoint
ALTER TABLE "swim_block_logs" ADD CONSTRAINT "swim_block_logs_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swim_block_logs" ADD CONSTRAINT "swim_block_logs_swim_block_id_swim_blocks_id_fk" FOREIGN KEY ("swim_block_id") REFERENCES "public"."swim_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swim_blocks" ADD CONSTRAINT "swim_blocks_routine_id_routines_id_fk" FOREIGN KEY ("routine_id") REFERENCES "public"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "swim_block_logs_session_block_idx" ON "swim_block_logs" USING btree ("session_id","swim_block_id");--> statement-breakpoint
CREATE INDEX "swim_block_logs_session_idx" ON "swim_block_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "swim_blocks_routine_idx" ON "swim_blocks" USING btree ("routine_id");