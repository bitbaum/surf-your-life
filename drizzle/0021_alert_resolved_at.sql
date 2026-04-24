-- Track when a clinical alert was resolved so practitioners can see the resolution timeline.
-- Nullable: existing resolved rows have no timestamp (resolved before this migration).
ALTER TABLE "client_alerts" ADD COLUMN "resolved_at" timestamp;
