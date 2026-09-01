import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── /api/health answers what the deploy pipeline asks ───────────────────────
//
// Every deploy ends with `curl -fsS /api/health`; monitors only read the status
// code. 200 must mean "up and the database answers", 503 must mean it doesn't —
// a health route that 200s while the DB is down hides exactly the outage it
// exists to surface.

const execute = vi.fn();
vi.mock("@/lib/db", () => ({ db: { execute: (...args: unknown[]) => execute(...args) } }));

import { GET } from "@/app/api/health/route";

beforeEach(() => {
  execute.mockReset();
});

describe("GET /api/health", () => {
  it("returns 200 with { success: true } and the LLM chain's health when the database answers", async () => {
    execute.mockResolvedValueOnce([{ "?column?": 1 }]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    // Informational only — asserting shape, not a specific status, since
    // this must never gate the 200/503 the deploy pipeline checks.
    expect(body.llm).toMatchObject({ status: expect.any(String) });
  });

  it("returns 503 with { success: false } when the database is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    execute.mockRejectedValueOnce(new Error("connection refused"));
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ success: false, error: "database unreachable" });
  });
});
