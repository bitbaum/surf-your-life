-- Add reminder opt-out flag to profiles
-- Default true: all existing users continue receiving reminders unless they opt out
ALTER TABLE "profiles" ADD COLUMN "receive_reminders" boolean NOT NULL DEFAULT true;
