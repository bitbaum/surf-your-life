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
-- NOTE: if either statement fails with "could not create unique index …
-- duplicate key value", the table already holds rows this rule forbids.
-- Resolve those by hand before re-running; do NOT relax the index. Query for
-- them with:
--   SELECT service_id, preferred_date, preferred_time, count(*)
--     FROM bookings WHERE status IN ('pending','confirmed')
--    GROUP BY 1,2,3 HAVING count(*) > 1;

-- One active booking per client per service.
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_user_service_idx"
  ON "bookings" ("user_id", "service_id")
  WHERE "status" IN ('pending', 'confirmed');

-- One active booking per service per date+time preference.
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_one_active_per_slot_idx"
  ON "bookings" ("service_id", "preferred_date", "preferred_time")
  WHERE "status" IN ('pending', 'confirmed');
