-- Explicit AI consent, asked once per client. Every decision is a new row
-- (granted, declined = "Not now", withdrawn) with its timestamp; the latest row
-- is the current state. Nothing is updated in place, so the table is the record
-- of what each client agreed to and when they withdrew. Additive only.
DO $$ BEGIN
  CREATE TYPE "ai_consent_action" AS ENUM ('granted', 'declined', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ai_consent_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "action" "ai_consent_action" NOT NULL,
  "policy_version" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "ai_consent_events_user_created_idx"
  ON "ai_consent_events" ("user_id", "created_at");
