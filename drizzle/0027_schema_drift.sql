-- Bring a fresh replay of this chain to the schema in lib/db/schema.ts.
-- Replayed onto an empty database, 0000-0026 left out ten profiles columns the
-- app writes on every sign-up, kept the non-cascading foreign keys that 0005
-- and 0009 declared inline (0010 added cascading twins under other names but
-- could not drop these), and kept two duplicate indexes from 0007. Every
-- statement is guarded, so on a database that already has the schema it does
-- nothing.

-- profiles: the intake fields (lib/db/schema.ts, profiles).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "work_hours_per_week" integer;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "insurance_provider" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "existing_diagnoses" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "family_history" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "height_cm" integer;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "weight_kg" integer;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "sleep_schedule" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "alcohol_tobacco" text;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "social_support" integer;

-- A non-cascading foreign key beside a cascading one on the same column blocks
-- the cascade: deleting a user with a thread or an enrolment fails. Each is
-- dropped only where its cascading twin exists, so the column is never left
-- without a foreign key.
DO $$
DECLARE
  pair text[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY ARRAY[
    ['threads', 'threads_client_id_fkey'],
    ['thread_messages', 'thread_messages_thread_id_fkey'],
    ['thread_messages', 'thread_messages_sender_id_fkey'],
    ['program_enrollments', 'programme_enrolments_client_id_fkey'],
    ['program_enrollments', 'programme_enrolments_programme_id_fkey']
  ] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_constraint stale
      JOIN pg_constraint twin
        ON twin.conrelid = stale.conrelid
       AND twin.conkey = stale.conkey
       AND twin.confrelid = stale.confrelid
       AND twin.oid <> stale.oid
       AND twin.contype = 'f'
       AND twin.confdeltype = 'c'
      WHERE stale.conrelid = to_regclass('public.' || pair[1])
        AND stale.conname = pair[2]
        AND stale.confdeltype = 'a'
    ) THEN
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', pair[1], pair[2]);
    END IF;
  END LOOP;
END $$;

-- Duplicates of bookings_user_idx and documents_user_idx (same column, same method).
DROP INDEX IF EXISTS "bookings_user_id_idx";
DROP INDEX IF EXISTS "documents_user_id_idx";
