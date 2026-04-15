-- Check-in UX improvements: sleep quality, orthostatic symptoms, journal entry
ALTER TABLE "check_ins"
  ADD COLUMN "sleep_quality" integer,
  ADD COLUMN "orthostatic_symptoms" boolean,
  ADD COLUMN "journal_entry" text;
