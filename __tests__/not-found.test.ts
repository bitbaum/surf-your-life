import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as apiCatchAll from "@/app/api/[...path]/route";

// lib/api pulls in Auth.js for its session helpers; the 404 path never uses it.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

// ─── Unknown paths are 404s, not 500s ────────────────────────────────────────
//
// GET /api/nope answered 500: no route matched, so Next rendered the ROOT
// not-found page, which sits outside the locale layout and used next-intl's
// Link with no provider above it. It threw, and a typo'd URL read as a server
// fault in the journal and to every monitor.

const ROOT = process.cwd();
const METHODS = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

describe("unknown /api/* paths", () => {
  it.each(METHODS)("%s answers a JSON 404 in the shared error shape", async (method) => {
    const handler = apiCatchAll[method];
    expect(handler, `${method} must be exported`).toBeTypeOf("function");
    const res = handler();
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ success: false, error: expect.any(String) });
  });
});

describe("the root not-found page", () => {
  const source = readFileSync(join(ROOT, "app", "not-found.tsx"), "utf8");

  it("does not use next-intl — nothing above it provides a locale", () => {
    expect(source).not.toMatch(/from\s+["'](?:next-intl[^"']*|@\/i18n\/[^"']*)["']/);
  });

  it("brings its own document, because the root layout renders none", () => {
    expect(source).toMatch(/<html\b/);
    expect(source).toMatch(/<body\b/);
  });
});

describe("unknown localized paths", () => {
  it("are caught under [locale] so the translated not-found page renders", () => {
    const rest = readFileSync(join(ROOT, "app", "[locale]", "[...rest]", "page.tsx"), "utf8");
    expect(rest).toMatch(/notFound\(\)/);
  });
});
