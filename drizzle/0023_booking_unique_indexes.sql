-- Make the two booking conflicts impossible instead of merely checked.
--
-- POST /api/bookings looked for a conflicting row and then inserted in a
-- separate statement, with no lock between them, so two concurrent requests
-- both saw nothing and both wrote. The checks stay (they give a clean 409 in
-- the common case); these indexes are what actually settle the race.
--
-- Both predicates mirror ACTIVE_BOOKING_STATUSES in lib/constants.ts. A
-- cancelled booking must not block a rebooking, which is what the route
-- already intended.
--
-- preferred_date / preferred_time are nullable and Postgres treats NULLs as
-- distinct, so a booking with no stated preference does not compete for a
-- slot — matching the route's `if (date && time)` guard.
--
-- ── Why this migration cleans data before it constrains it ──────────────────
--
-- A unique index cannot be built over rows that already violate it, and this
-- table holds such rows: the route has ALWAYS rejected a second active booking
-- for the same (user, service) — that is the `existingOwn` 409, which predates
-- this migration — but rows written before that check existed, or through the
-- very race these indexes close, are still sitting in the table. On the
-- production database that was two `pending` rows for one client and one
-- service, and it aborted the deploy on every push for two days: the schema
-- step fails, no code ships, and a later migration can never run because the
-- runner stops here. So the reconciliation has to live in THIS file, ahead of
-- the indexes, not in a follow-up one.
--
-- Which row survives is not a guess. The route's own rule is that an existing
-- active booking makes the NEXT one a 409, so the earliest active row per
-- group is the one that would have existed had the constraint always held;
-- later duplicates are the writes that should never have landed. They are
-- moved to 'cancelled' rather than deleted, so the record stays auditable and
-- the change is reversible. Nothing is emailed — booking mail is sent by the
-- route on create, never by a status change.
--
-- Both statements are no-ops on a database whose data is already clean, which
-- is every environment except the one that accumulated the drift.

-- One active booking per client per service: keep the earliest, cancel the rest.
UPDATE "bookings" b
   SET "status" = 'cancelled'
  FROM (
    SELECT "id",
           row_number() OVER (
             PARTITION BY "user_id", "service_id"
             ORDER BY "created_at", "id"
           ) AS rn
      FROM "bookings"
     WHERE "status" IN ('pending', 'confirmed')
  ) dup
 WHERE b."id" = dup."id"
   AND dup.rn > 1;

-- One active booking per service per date+time preference: same rule. Rows
-- with no stated preference are excluded, because the index below treats their
-- NULLs as distinct and so they never collide.
UPDATE "bookings" b
   SET "status" = 'cancelled'
  FROM (
    SELECT "id",
           row_number() OVER (
             PARTITION BY "service_id", "preferred_date", "preferred_time"
             ORDER BY "created_at", "id"
           ) AS rn
      FROM "bookings"
     WHERE "status" IN ('pending', 'confirmed')
       AND "preferred_date" IS NOT NULL
       AND "preferred_time" IS NOT NULL
  ) dup
 WHERE b."id" = dup."id"
   AND dup.rn > 1;

-- One active booking per client per service.
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_user_service_idx"
  ON "bookings" ("user_id", "service_id")
  WHERE "status" IN ('pending', 'confirmed');

-- One active booking per service per date+time preference.
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_slot_idx"
  ON "bookings" ("service_id", "preferred_date", "preferred_time")
  WHERE "status" IN ('pending', 'confirmed');
