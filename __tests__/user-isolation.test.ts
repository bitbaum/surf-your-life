import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SQL, Table } from "drizzle-orm";

// ─── Cross-user clinical-data isolation regression net ───────────────────────
//
// The portal has no RLS: isolation lives entirely in the application layer —
// every query touching user-owned clinical rows MUST scope by the session
// user's id (CLAUDE.md: "Never expose a user's data to another user").
//
// These tests exercise the real route handlers with a mocked session (user A)
// against an in-memory fake db seeded with user B's clinical rows. The fake db
// compiles each Drizzle `where` expression to SQL via PgDialect and evaluates
// its equality predicates against the stored rows — so it behaves like the
// real database for the AND-of-equalities conditions these routes use.
// If the `eq(table.userId, session.user.id)` scoping (or the explicit
// ownership check) is removed from a route, user B's row matches by id alone,
// the handler succeeds, and these tests FAIL.

const h = vi.hoisted(() => ({
  session: {
    current: null as { user: { id: string; email: string | null; role: string } } | null,
  },
  store: {} as Record<string, Array<Record<string, unknown>>>,
}));

vi.mock("@/lib/auth", () => ({
  auth: async () => h.session.current,
}));

// embedCheckIn pulls in the OpenAI client + real db — irrelevant here.
vi.mock("@/lib/domain/embeddings", () => ({
  embedCheckIn: async () => {},
}));

vi.mock("@/lib/db", async () => {
  const { getTableColumns, getTableName } = await import("drizzle-orm");
  const { PgDialect } = await import("drizzle-orm/pg-core");
  const schema = await import("@/lib/db/schema");
  const dialect = new PgDialect();

  const rowsOf = (table: Table) => h.store[getTableName(table)] ?? [];

  // Evaluate a Drizzle where-expression against a row. Only AND-combined
  // equality predicates are supported — exactly the shape user-scoped queries
  // take. Anything else throws so the fake can never silently match/skip rows.
  function matches(table: Table, row: Record<string, unknown>, cond: SQL | undefined): boolean {
    if (!cond) return true;
    const { sql, params } = dialect.sqlToQuery(cond);
    if (/\s+or\s+/i.test(sql)) throw new Error(`fake db: OR is unsupported: ${sql}`);
    const predicates = [...sql.matchAll(/(?:"\w+"\.)?"(\w+)"\s*=\s*\$(\d+)/g)];
    const equalsCount = (sql.match(/=/g) ?? []).length;
    if (predicates.length === 0 || predicates.length !== equalsCount) {
      throw new Error(`fake db: unsupported where clause: ${sql}`);
    }
    const tsNameByDbName = Object.fromEntries(
      Object.entries(getTableColumns(table)).map(([tsName, col]) => [col.name, tsName]),
    );
    return predicates.every((m) => row[tsNameByDbName[m[1]]] === params[Number(m[2]) - 1]);
  }

  const finder = (table: Table) => ({
    findFirst: async (opts: { where?: SQL } = {}) =>
      rowsOf(table).find((r) => matches(table, r, opts.where)),
    findMany: async (opts: { where?: SQL; limit?: number } = {}) => {
      const out = rowsOf(table).filter((r) => matches(table, r, opts.where));
      return opts.limit ? out.slice(0, opts.limit) : out;
    },
  });

  const db = {
    query: {
      checkIns: finder(schema.checkIns),
      medicationLog: finder(schema.medicationLog),
    },
    update: (table: Table) => ({
      set: (values: Record<string, unknown>) => ({
        where: (cond: SQL | undefined) => ({
          returning: async () => {
            const matched = rowsOf(table).filter((r) => matches(table, r, cond));
            for (const r of matched) Object.assign(r, values);
            return matched.map((r) => ({ ...r }));
          },
        }),
      }),
    }),
    delete: (table: Table) => ({
      where: async (cond: SQL | undefined) => {
        const name = getTableName(table);
        h.store[name] = rowsOf(table).filter((r) => !matches(table, r, cond));
      },
    }),
  };

  return { db };
});

import { getTableName } from "drizzle-orm";
import { checkIns, medicationLog } from "@/lib/db/schema";
import { PUT as putCheckIn, DELETE as deleteCheckIn } from "@/app/api/check-in/[id]/route";
import {
  PATCH as patchMedication,
  DELETE as deleteMedication,
} from "@/app/api/medication-log/[id]/route";
import { GET as listMedications } from "@/app/api/medication-log/route";

const CHECK_INS = getTableName(checkIns);
const MEDICATION_LOG = getTableName(medicationLog);

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CHECKIN_A = "11111111-1111-4111-8111-111111111111";
const CHECKIN_B = "22222222-2222-4222-8222-222222222222";
const MED_A = "33333333-3333-4333-8333-333333333333";
const MED_B = "44444444-4444-4444-8444-444444444444";

const jsonRequest = (method: string, body: object) =>
  new Request("http://localhost/api/test", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const checkInB = () => h.store[CHECK_INS].find((r) => r.id === CHECKIN_B);
const medB = () => h.store[MEDICATION_LOG].find((r) => r.id === MED_B);

const validCheckInBody = { mood: "excellent", energyLevel: 9 };

beforeEach(() => {
  h.session.current = { user: { id: USER_A, email: "a@example.com", role: "client" } };
  h.store[CHECK_INS] = [
    {
      id: CHECKIN_A,
      userId: USER_A,
      mood: "neutral",
      energyLevel: 5,
      journalEntry: "user A's private journal",
      createdAt: new Date(),
    },
    {
      id: CHECKIN_B,
      userId: USER_B,
      mood: "low",
      energyLevel: 3,
      journalEntry: "user B's private journal",
      createdAt: new Date(),
    },
  ];
  h.store[MEDICATION_LOG] = [
    {
      id: MED_A,
      userId: USER_A,
      medicationName: "Magnesium",
      endDate: null,
      createdAt: new Date(),
    },
    {
      id: MED_B,
      userId: USER_B,
      medicationName: "Sertraline",
      endDate: null,
      createdAt: new Date(),
    },
  ];
});

// ─── Daily check-ins (PUT / DELETE by id) ────────────────────────────────────

describe("check-in isolation: user A vs user B's check-in", () => {
  it("PUT on another user's check-in is rejected and the row is untouched", async () => {
    const res = await putCheckIn(jsonRequest("PUT", validCheckInBody), params(CHECKIN_B));
    expect([403, 404]).toContain(res.status);
    const body = await res.json();
    expect(body.success).toBe(false);
    // B's clinical data must be byte-for-byte untouched
    expect(checkInB()).toMatchObject({
      userId: USER_B,
      mood: "low",
      energyLevel: 3,
      journalEntry: "user B's private journal",
    });
    // and A's own data must never leak into the response
    expect(JSON.stringify(body)).not.toContain("user B's private journal");
  });

  it("DELETE on another user's check-in is rejected and the row survives", async () => {
    const res = await deleteCheckIn(jsonRequest("DELETE", {}), params(CHECKIN_B));
    expect([403, 404]).toContain(res.status);
    expect((await res.json()).success).toBe(false);
    expect(checkInB()).toBeDefined();
  });

  // Controls: prove the harness actually mutates when scoping is satisfied —
  // without these, the isolation tests above could pass vacuously against a
  // broken fake that never matches anything.
  it("control: PUT on the user's own check-in succeeds and persists", async () => {
    const res = await putCheckIn(jsonRequest("PUT", validCheckInBody), params(CHECKIN_A));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(h.store[CHECK_INS].find((r) => r.id === CHECKIN_A)).toMatchObject({
      mood: "excellent",
      energyLevel: 9,
    });
  });

  it("control: DELETE on the user's own check-in removes exactly that row", async () => {
    const res = await deleteCheckIn(jsonRequest("DELETE", {}), params(CHECKIN_A));
    expect(res.status).toBe(200);
    expect(h.store[CHECK_INS].map((r) => r.id)).toEqual([CHECKIN_B]);
  });

  it("unauthenticated PUT is rejected with 401", async () => {
    h.session.current = null;
    const res = await putCheckIn(jsonRequest("PUT", validCheckInBody), params(CHECKIN_B));
    expect(res.status).toBe(401);
    expect(checkInB()).toMatchObject({ energyLevel: 3 });
  });
});

// ─── Medication log (GET list / PATCH / DELETE by id) ────────────────────────
//
// Unlike check-ins, these routes have no separate ownership pre-check — the
// `eq(medicationLog.userId, session.user.id)` where-clause IS the isolation.

describe("medication-log isolation: user A vs user B's entries", () => {
  it("GET returns only the session user's entries", async () => {
    const res = await listMedications();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.map((r: { id: string }) => r.id)).toEqual([MED_A]);
    expect(JSON.stringify(body)).not.toContain("Sertraline");
  });

  it("PATCH on another user's entry returns 404 and does not modify it", async () => {
    const res = await patchMedication(
      jsonRequest("PATCH", { endDate: "2026-01-31" }),
      params(MED_B),
    );
    expect(res.status).toBe(404);
    expect((await res.json()).success).toBe(false);
    expect(medB()).toMatchObject({ endDate: null });
  });

  it("DELETE on another user's entry leaves it in place", async () => {
    await deleteMedication(jsonRequest("DELETE", {}), params(MED_B));
    expect(medB()).toBeDefined();
  });

  it("control: PATCH on the user's own entry succeeds and persists", async () => {
    const res = await patchMedication(
      jsonRequest("PATCH", { endDate: "2026-01-31" }),
      params(MED_A),
    );
    expect(res.status).toBe(200);
    expect(h.store[MEDICATION_LOG].find((r) => r.id === MED_A)).toMatchObject({
      endDate: "2026-01-31",
    });
  });

  it("control: DELETE on the user's own entry removes exactly that row", async () => {
    await deleteMedication(jsonRequest("DELETE", {}), params(MED_A));
    expect(h.store[MEDICATION_LOG].map((r) => r.id)).toEqual([MED_B]);
  });
});
