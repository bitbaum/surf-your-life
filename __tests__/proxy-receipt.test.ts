import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

// Read the actual static matcher without importing the auth/database runtime.
const source = readFileSync(new URL("../proxy.ts", import.meta.url), "utf8");
const literal = source.match(/matcher:\s*\[\s*("(?:\\.|[^"\\])*")/);
if (!literal) throw new Error("Proxy matcher must remain statically analyzable");
const config = { matcher: [JSON.parse(literal[1]) as string] };
const matches = (url: string) => unstable_doesMiddlewareMatch({ config, nextConfig: {}, url });

describe("public artifact receipt", () => {
  it.each(["/.well-known/fleet-release.json", "/.well-known/fleet-release.json?commit=abc"])(
    "serves %s without login or locale redirection",
    (url) => expect(matches(url)).toBe(false),
  );

  it.each([
    "/dashboard",
    "/de/admin/dashboard",
    "/.well-known/private.json",
    "/.well-known/fleet-release.json/private",
    "/.well-known/fleet-release.json.bak",
    "/de/.well-known/fleet-release.json",
  ])("preserves proxy protection for %s", (url) => expect(matches(url)).toBe(true));
});
