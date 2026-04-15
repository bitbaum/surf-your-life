-- Phase 1: Clinical depth — activity level, PEM tracking, new tables

-- New enums
DO $$ BEGIN
  CREATE TYPE "activity_level" AS ENUM ('rest', 'light', 'moderate', 'active');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "alert_type" AS ENUM ('energy_decline', 'fatigue_spike', 'pem_cluster', 'missed_checkins', 'mood_decline', 'stress_spike');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "alert_severity" AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Add activity level and PEM columns to check_ins
ALTER TABLE "check_ins"
  ADD COLUMN IF NOT EXISTS "activity_level" "activity_level",
  ADD COLUMN IF NOT EXISTS "pem_flag" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "pem_severity" integer;

-- Functional assessments table
CREATE TABLE IF NOT EXISTS "functional_assessments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "assessed_at" timestamp DEFAULT now() NOT NULL,
  "overall_capacity" integer NOT NULL,
  "cognitive_capacity" integer,
  "physical_capacity" integer,
  "emotional_capacity" integer,
  "social_capacity" integer,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "functional_assessments_user_idx" ON "functional_assessments"("user_id");

-- Medication log table
CREATE TABLE IF NOT EXISTS "medication_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "medication_name" text NOT NULL,
  "dose" text,
  "frequency" text,
  "start_date" text,
  "end_date" text,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "medication_log_user_idx" ON "medication_log"("user_id");

-- Client alerts table (rule-based clinical signals for practitioners)
CREATE TABLE IF NOT EXISTS "client_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "alert_type" NOT NULL,
  "severity" "alert_severity" DEFAULT 'medium' NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "is_resolved" boolean DEFAULT false NOT NULL,
  "check_in_id" uuid REFERENCES "check_ins"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "client_alerts_client_id_idx" ON "client_alerts"("client_id");
CREATE INDEX IF NOT EXISTS "client_alerts_resolved_idx" ON "client_alerts"("is_resolved");
