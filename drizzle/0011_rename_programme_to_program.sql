-- Rename British-English spellings to American English.
-- programmes → programs, programme_enrolments → program_enrollments,
-- programme_status enum → program_status.

-- 1. Rename enum type
ALTER TYPE programme_status RENAME TO program_status;

-- 2. Rename tables
ALTER TABLE programmes RENAME TO programs;
ALTER TABLE programme_enrolments RENAME TO program_enrollments;

-- 3. Rename column programme_id → program_id
ALTER TABLE program_enrollments RENAME COLUMN programme_id TO program_id;

-- 4. Rename indexes
ALTER INDEX IF EXISTS programme_enrolments_client_id_idx RENAME TO program_enrollments_client_id_idx;
ALTER INDEX IF EXISTS programme_enrolments_programme_id_idx RENAME TO program_enrollments_program_id_idx;
