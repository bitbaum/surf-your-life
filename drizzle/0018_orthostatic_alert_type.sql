-- Add orthostatic_intolerance to alert_type enum
ALTER TYPE "alert_type" ADD VALUE IF NOT EXISTS 'orthostatic_intolerance';
