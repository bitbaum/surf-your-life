-- The app's own role could not read session_preps: 0024 created it before the
-- deploy's schema step began setting default privileges for the app role, and
-- that step deliberately never grants an existing table by itself (an existing
-- restriction may be a decision). This migration is that decision, recorded:
-- the app reads and writes its preps. The deploy applies it as the postgres
-- superuser, so it can grant on a table the app role does not own.
--
-- Guarded on the role existing: the migration-drift check and local databases
-- replay this chain with no role of that name. Grants are not part of the
-- drift catalog, so the replayed and pushed schemas still agree.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'surf_your_life') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON "session_preps" TO surf_your_life;
  END IF;
END
$$;
