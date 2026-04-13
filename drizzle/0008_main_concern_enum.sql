-- Convert profiles.main_concern from text to a typed enum.
-- Safe to run: existing non-enum values are coerced to NULL.

DO $$ BEGIN
  CREATE TYPE main_concern_type AS ENUM (
    'burnout', 'long_covid', 'midlife_reinvention', 'general_wellbeing', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ALTER COLUMN main_concern TYPE main_concern_type
  USING CASE
    WHEN main_concern IN ('burnout', 'long_covid', 'midlife_reinvention', 'general_wellbeing', 'other')
    THEN main_concern::main_concern_type
    ELSE NULL
  END;
