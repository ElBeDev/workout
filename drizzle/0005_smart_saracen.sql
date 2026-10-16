CREATE TABLE "coach_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"status" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"ended_at" timestamp,
	"ended_by" uuid
);
--> statement-breakpoint
CREATE TABLE "coaches" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"brand_name" text,
	"accent_color" text,
	"plan" text DEFAULT 'coach' NOT NULL,
	"billing_status" text DEFAULT 'trialing' NOT NULL,
	"trial_ends_at" timestamp,
	"current_period_end" timestamp,
	"past_due_since" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coaches_code_unique" UNIQUE("code"),
	CONSTRAINT "coaches_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "coaches_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "coach_id" uuid;--> statement-breakpoint
ALTER TABLE "routines" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "coach_clients" ADD CONSTRAINT "coach_clients_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_clients" ADD CONSTRAINT "coach_clients_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_clients" ADD CONSTRAINT "coach_clients_ended_by_users_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coach_clients_one_open_idx" ON "coach_clients" USING btree ("client_id") WHERE status in ('pending', 'active');--> statement-breakpoint
CREATE INDEX "coach_clients_coach_idx" ON "coach_clients" USING btree ("coach_id","status");--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routines" ADD CONSTRAINT "routines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;