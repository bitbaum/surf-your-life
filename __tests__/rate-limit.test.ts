import { describe, it, expect } from "vitest";

import { checkRateLimit, ipKey } from "@/lib/rate-limit";

function req(xff: string | null): Request {
  return new Request("https://example.test/api/contact", {
    headers: xff === null ? {} : { "x-forwarded-for": xff },
  });
}

describe("checkRateLimit", () => {
  it("allows up to the limit, then refuses with an honest retry time", () => {
    const key = `test-allow:${Math.random()}`;

    expect(checkRateLimit(key, 3)).toEqual({ ok: true, remaining: 2, retryAfterSecs: 0 });
    expect(checkRateLimit(key, 3)).toEqual({ ok: true, remaining: 1, retryAfterSecs: 0 });
    expect(checkRateLimit(key, 3)).toEqual({ ok: true, remaining: 0, retryAfterSecs: 0 });

    const refused = checkRateLimit(key, 3);
    expect(refused.ok).toBe(false);
    expect(refused.remaining).toBe(0);
    // 15-minute window: the retry time is derived from the oldest counted hit,
    // so it is a real number of seconds, never a guess.
    expect(refused.retryAfterSecs).toBeGreaterThan(0);
    expect(refused.retryAfterSecs).toBeLessThanOrEqual(15 * 60);
  });

  it("counts each key separately", () => {
    const a = `test-sep-a:${Math.random()}`;
    const b = `test-sep-b:${Math.random()}`;

    expect(checkRateLimit(a, 1).ok).toBe(true);
    expect(checkRateLimit(a, 1).ok).toBe(false);
    expect(checkRateLimit(b, 1).ok).toBe(true);
  });

  it("does not punish a refused request further (a full bucket stays at the same retry time)", () => {
    const key = `test-refuse:${Math.random()}`;
    expect(checkRateLimit(key, 1).ok).toBe(true);

    const first = checkRateLimit(key, 1);
    const second = checkRateLimit(key, 1);
    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
    // Refusals count nothing, so the window still opens at the same moment.
    expect(Math.abs(second.retryAfterSecs - first.retryAfterSecs)).toBeLessThanOrEqual(1);
  });
});

describe("ipKey", () => {
  it("keys on the last X-Forwarded-For hop — the one the client cannot forge", () => {
    // One reverse proxy (Caddy) appends what it actually saw, so a client that
    // invents a value only pollutes the entries to its left.
    expect(ipKey(req("9.9.9.9, 203.0.113.7"), "contact")).toBe("contact:203.0.113.7");
  });

  it("namespaces by route prefix", () => {
    expect(ipKey(req("203.0.113.7"), "leads")).toBe("leads:203.0.113.7");
  });

  it("falls back to a shared bucket when no forwarded header is present", () => {
    expect(ipKey(req(null), "contact")).toBe("contact:unknown");
  });
});
