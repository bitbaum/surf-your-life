CREATE TYPE "public"."service_category" AS ENUM('machine', 'space', 'consultation');
--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled');
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "service_category" NOT NULL,
	"duration_minutes" integer,
	"available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"preferred_date" text,
	"preferred_time" text,
	"notes" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");
--> statement-breakpoint
INSERT INTO "services" ("name", "description", "category", "duration_minutes", "available", "sort_order") VALUES
  ('Vacuul Session', 'Lower-body negative pressure therapy supporting circulation, lymphatic drainage, and cellular recovery. A core tool in our biological reset phase.', 'machine', 60, true, 1),
  ('Coworking — Half Day', 'Access to our 230 m² performance space for focused work in a calm, clinical environment. Ideal for those reintegrating gradually.', 'space', 240, true, 2),
  ('Coworking — Full Day', 'Full-day access to the performance space. Includes use of quiet zones, standing desks, and the recovery lounge.', 'space', 480, true, 3),
  ('Initial Consultation', 'A 60-minute psychiatric assessment with Dr. Manu. Covers your medical history, current state, work context, and goals. The starting point for every programme.', 'consultation', 60, true, 4);
