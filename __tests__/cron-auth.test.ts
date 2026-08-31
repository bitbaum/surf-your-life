import { describe, it, expect, afterEach } from "vitest";
import { verifyCronAuth } from "@/lib/auth/cron";

// ─── Cron auth fails CLOSED ──────────────────────────────────────────────────
//
// The bug this file exists for: the helper used to compare the header against
// `Bearer ${process.env.CRON_SECRET}`, which is the literal string
// "Bearer undefined" when the variable is unset — so a missing secret
// authorized anyone sending that header. verifyCronAuth guards the reminders,
// weekly-report, ai-digest, and embed-backfill routes; none should run for an
// unauthenticated caller.

const req = (authorization?: string) =>
  new Request("http://localhost/api/cron/thing", {
    headers: authorization ? { authorization } : {},
  });

const ORIGINAL = process.env.CRON_SECRET;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL;
});

describe("an unset secret denies everything", () => {
  it("denies when CRON_SECRET is missing, whatever is sent", () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronAuth(req("Bearer anything"))).not.toBeNull();
    expect(verifyCronAuth(req("Bearer undefined"))).not.toBeNull();
    expect(verifyCronAuth(req())).not.toBeNull();
  });

  it("denies when CRON_SECRET is empty", () => {
    process.env.CRON_SECRET = "";
    expect(verifyCronAuth(req("Bearer "))).not.toBeNull();
  });
});

describe("with a secret configured", () => {
  const SECRET = "a-real-cron-secret-value";

  it("accepts the matching bearer token", () => {
    process.env.CRON_SECRET = SECRET;
    expect(verifyCronAuth(req(`Bearer ${SECRET}`))).toBeNull();
  });

  it("rejects a wrong token", () => {
    process.env.CRON_SECRET = SECRET;
    expect(verifyCronAuth(req("Bearer wrong"))).not.toBeNull();
  });

  it("rejects a token that merely starts or ends correctly", () => {
    process.env.CRON_SECRET = SECRET;
    expect(verifyCronAuth(req(`Bearer ${SECRET.slice(0, -1)}`))).not.toBeNull();
    expect(verifyCronAuth(req(`Bearer ${SECRET}x`))).not.toBeNull();
  });

  it("rejects a missing header", () => {
    process.env.CRON_SECRET = SECRET;
    expect(verifyCronAuth(req())).not.toBeNull();
  });

  it("rejects the raw secret without the Bearer scheme", () => {
    process.env.CRON_SECRET = SECRET;
    expect(verifyCronAuth(req(SECRET))).not.toBeNull();
  });

  it("rejects another scheme carrying the right secret", () => {
    process.env.CRON_SECRET = SECRET;
    expect(verifyCronAuth(req(`Basic ${SECRET}`))).not.toBeNull();
  });

  it("is case-sensitive", () => {
    process.env.CRON_SECRET = SECRET;
    expect(verifyCronAuth(req(`Bearer ${SECRET.toUpperCase()}`))).not.toBeNull();
  });

  it("answers 401 without explaining why", async () => {
    process.env.CRON_SECRET = SECRET;
    const res = verifyCronAuth(req("Bearer wrong"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
    await expect(res!.json()).resolves.toEqual({ success: false, error: "Unauthorized" });
  });
});
