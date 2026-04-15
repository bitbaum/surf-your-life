-- Therapeutic technique library, assignments, and tracking

DO $$ BEGIN
  CREATE TYPE "technique_category" AS ENUM (
    'breathwork', 'movement', 'mindfulness', 'cognitive', 'pacing', 'sleep', 'social'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "technique_difficulty" AS ENUM ('easy', 'moderate', 'challenging');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "techniques" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" "technique_category" NOT NULL,
  "instructions" text,
  "duration_minutes" integer,
  "difficulty" "technique_difficulty" NOT NULL DEFAULT 'easy',
  "resource_url" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "technique_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "technique_id" uuid NOT NULL REFERENCES "techniques"("id") ON DELETE CASCADE,
  "client_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assigned_by" uuid NOT NULL REFERENCES "users"("id"),
  "frequency_per_day" integer NOT NULL DEFAULT 1,
  "safety_cap_multiplier" integer NOT NULL DEFAULT 150,
  "max_debt_days" integer NOT NULL DEFAULT 7,
  "start_date" text NOT NULL,
  "end_date" text,
  "notes" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "technique_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assignment_id" uuid NOT NULL REFERENCES "technique_assignments"("id") ON DELETE CASCADE,
  "date" text NOT NULL,
  "completed_reps" integer NOT NULL DEFAULT 1,
  "notes" text,
  "is_rest_day" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "techniques_category_idx" ON "techniques" ("category");
CREATE INDEX IF NOT EXISTS "techniques_active_idx" ON "techniques" ("is_active");
CREATE INDEX IF NOT EXISTS "technique_assignments_client_idx" ON "technique_assignments" ("client_id");
CREATE INDEX IF NOT EXISTS "technique_assignments_technique_idx" ON "technique_assignments" ("technique_id");
CREATE INDEX IF NOT EXISTS "technique_logs_user_idx" ON "technique_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "technique_logs_assignment_idx" ON "technique_logs" ("assignment_id");
CREATE INDEX IF NOT EXISTS "technique_logs_date_idx" ON "technique_logs" ("date");
