-- AccountKit's screens are the only writer of credentials since this release
-- (docs/ACCOUNTKIT-MIGRATION.md). Its account panel renames a person and
-- deletes an account in `auth_users`; both now reach Surf Your Life's `users`:
--   - a rename sets users.name (an empty name clears it);
--   - a deletion removes the person's rows in the order the old
--     /api/account/delete used, then the users row (the rest cascades).
-- The functions are replaced in place, so a box whose mirror is attached picks
-- them up at once. The deletion trigger is attached here only where the mirror
-- already is (production since the 2026-11-01 import); elsewhere the import
-- attaches it with the others. Additive and idempotent.
CREATE OR REPLACE FUNCTION surf_accountkit_to_users() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email_verified AND NOT OLD.email_verified THEN
    UPDATE users SET email_verified = now()
    WHERE id::text = NEW.id AND email_verified IS NULL;
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE users SET email = NEW.email
    WHERE id::text = NEW.id AND lower(email) IS DISTINCT FROM NEW.email;
  END IF;
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE users SET name = nullif(NEW.name, '')
    WHERE id::text = NEW.id AND coalesce(name, '') IS DISTINCT FROM NEW.name;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION surf_accountkit_delete_users() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  person uuid;
  address text;
BEGIN
  SELECT id, email INTO person, address FROM users WHERE id::text = OLD.id;
  IF person IS NULL THEN RETURN OLD; END IF;
  DELETE FROM thread_messages WHERE sender_id = person;
  DELETE FROM threads WHERE client_id = person;
  DELETE FROM bookings WHERE user_id = person;
  DELETE FROM check_ins WHERE user_id = person;
  DELETE FROM profiles WHERE user_id = person;
  DELETE FROM password_reset_tokens WHERE user_id = person;
  DELETE FROM verification_tokens WHERE identifier = address;
  DELETE FROM sessions WHERE user_id = person;
  DELETE FROM accounts WHERE user_id = person;
  DELETE FROM users WHERE id = person;
  RETURN OLD;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'surf_accountkit_to_users' AND NOT tgisinternal) THEN
    DROP TRIGGER IF EXISTS surf_accountkit_delete_users ON auth_users;
    CREATE TRIGGER surf_accountkit_delete_users AFTER DELETE ON auth_users
      FOR EACH ROW EXECUTE FUNCTION surf_accountkit_delete_users();
  END IF;
END $$;
