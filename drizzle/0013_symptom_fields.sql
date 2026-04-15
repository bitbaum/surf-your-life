-- Add optional symptom severity columns to check_ins (1–10, nullable)
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS symptom_fatigue integer;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS symptom_brain_fog integer;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS symptom_pain integer;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS stress_level integer;
