-- Phase 4: Programme engine — template flag and phase config
ALTER TABLE "programs"
  ADD COLUMN IF NOT EXISTS "is_template" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "phase_config" jsonb;
