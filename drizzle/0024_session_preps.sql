-- Keep the latest practitioner session prep so the client page can show it
-- without calling the model. A prep is generated only on an explicit click
-- (it spends the shared free AI pool); before this table the card regenerated
-- on every page load. Additive only.
CREATE TABLE IF NOT EXISTS "session_preps" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "author_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "summary" text NOT NULL,
  "ai_generated" boolean NOT NULL,
  "stats" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "session_preps_client_created_idx"
  ON "session_preps" ("client_id", "created_at");
