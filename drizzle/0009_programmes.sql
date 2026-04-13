-- Programmes: structured multi-week recovery plans.
-- ProgrammeEnrolments: which clients are enrolled in which programmes.

DO $$ BEGIN
  CREATE TYPE programme_status AS ENUM ('active', 'completed', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS programmes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  duration_weeks INTEGER,
  target_concern main_concern_type,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programme_enrolments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES users(id),
  programme_id   UUID NOT NULL REFERENCES programmes(id),
  status         programme_status NOT NULL DEFAULT 'active',
  start_date     TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS programme_enrolments_client_id_idx ON programme_enrolments(client_id);
CREATE INDEX IF NOT EXISTS programme_enrolments_programme_id_idx ON programme_enrolments(programme_id);
