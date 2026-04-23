-- Add missing indexes for frequently-queried columns
-- users.role: queried by all cron routes (reminders, weekly-report, ai-digest)
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");
-- assignments.client_id: FK without index, queried per-client in assignments route
CREATE INDEX IF NOT EXISTS "assignments_client_id_idx" ON "assignments" ("client_id");
