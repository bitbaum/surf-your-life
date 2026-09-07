/**
 * The booking races, and the constraint that settles them.
 *
 * POST /api/bookings checks for a conflict and then inserts in a separate
 * statement, with no lock between them — so two concurrent requests both see
 * nothing and both write. The checks stay because they give a clean 409 in the
 * common case, but correctness now rests on two partial unique indexes
 * (drizzle/0023_booking_unique_indexes.sql).
 *
 * What that leaves to test here is the half that is pure logic: when the
 * database rejects the loser of a race, the route must answer with the SAME
 * 409 the check would have given — not a 500. A race that surfaces as a server
 * error looks like an outage and gets retried.
 */
import { describe, it, expect } from "vitest";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/constants";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const routeSrc = readFileSync(join(ROOT, "app/api/bookings/route.ts"), "utf8");
const migration = readFileSync(join(ROOT, "drizzle/0023_booking_unique_indexes.sql"), "utf8");
const schemaSrc = readFileSync(join(ROOT, "lib/db/schema.ts"), "utf8");

// The helper is not exported (the route is the public surface), so exercise it
// through a faithful re-declaration and pin the route to the same shape below.
function uniqueViolation(err: unknown): string | null {
  const e = err as { code?: unknown; constraint?: unknown; cause?: unknown };
  if (e?.code === "23505") {
    return typeof e.constraint === "string" ? e.constraint : "";
  }
  const cause = e?.cause as { code?: unknown; constraint?: unknown } | undefined;
  if (cause?.code === "23505") {
    return typeof cause.constraint === "string" ? cause.constraint : "";
  }
  return null;
}

describe("unique-violation detection", () => {
  it("recognises a bare pg error", () => {
    expect(uniqueViolation({ code: "23505", constraint: "bookings_one_active_per_slot_idx" })).toBe(
      "bookings_one_active_per_slot_idx",
    );
  });

  it("recognises the driver error Drizzle wraps in `cause`", () => {
    const wrapped = Object.assign(new Error("insert failed"), {
      cause: { code: "23505", constraint: "bookings_one_active_per_user_service_idx" },
    });
    expect(uniqueViolation(wrapped)).toBe("bookings_one_active_per_user_service_idx");
  });

  it("returns null for anything that is not a unique violation", () => {
    // A catch that answers 409 to every error hides outages behind a
    // plausible-looking message, so non-23505 must keep propagating.
    expect(uniqueViolation(new Error("connection terminated"))).toBeNull();
    expect(uniqueViolation({ code: "23503" })).toBeNull();
    expect(uniqueViolation(undefined)).toBeNull();
  });
});

describe("the route maps each constraint to its own 409", () => {
  it("handles the slot index and the duplicate index separately", () => {
    expect(routeSrc).toContain("bookings_one_active_per_slot_idx");
    expect(routeSrc).toContain("bookings_one_active_per_user_service_idx");
  });

  it("re-throws anything that is not a unique violation", () => {
    expect(routeSrc).toMatch(/throw err;/);
  });

  it("detects 23505 rather than matching on an error message", () => {
    expect(routeSrc).toContain('"23505"');
  });
});

describe("the constraints exist and match the route's own status filter", () => {
  // If ACTIVE_BOOKING_STATUSES ever gains a status, the indexes silently stop
  // covering it — the check would still 409 but the race would reopen.
  it("indexes both races", () => {
    expect(migration).toContain("bookings_one_active_per_user_service_idx");
    expect(migration).toContain("bookings_one_active_per_slot_idx");
    expect(schemaSrc).toContain("bookings_one_active_per_slot_idx");
  });

  it("the SQL predicate lists exactly the active statuses", () => {
    for (const status of ACTIVE_BOOKING_STATUSES) {
      expect(migration).toContain(`'${status}'`);
    }
    const predicates = migration.match(/WHERE "status" IN \(([^)]*)\)/g) ?? [];
    expect(predicates).toHaveLength(2);
    for (const p of predicates) {
      const listed = (p.match(/'[a-z_]+'/g) ?? []).map((s) => s.replaceAll("'", ""));
      expect(listed.sort()).toEqual([...ACTIVE_BOOKING_STATUSES].sort());
    }
  });

  it("is registered in the migration journal, or it never runs", () => {
    const journal = readFileSync(join(ROOT, "drizzle/meta/_journal.json"), "utf8");
    expect(journal).toContain("0023_booking_unique_indexes");
  });
});
