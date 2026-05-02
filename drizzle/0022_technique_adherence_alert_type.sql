-- Add technique_adherence_decline to alert_type enum
ALTER TYPE "alert_type" ADD VALUE IF NOT EXISTS 'technique_adherence_decline';
