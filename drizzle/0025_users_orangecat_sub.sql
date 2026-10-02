-- "Sign in with OrangeCat": key those users on the OIDC `sub` (OrangeCat's
-- actor id), never on email. Nullable — every existing user (credentials or
-- Google) stays NULL, and a unique index allows any number of NULLs.
-- Additive only.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "orangecat_sub" text;

CREATE UNIQUE INDEX IF NOT EXISTS "users_orangecat_sub_unique"
  ON "users" ("orangecat_sub");
