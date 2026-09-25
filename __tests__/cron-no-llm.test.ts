import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

// ─── No cron route may reach a model ─────────────────────────────────────────
//
// The free AI keys are ONE pool shared by every app on the box. The Sunday
// ai-digest cron spent it with nobody asking for the result, and the apps
// people were actually using ran dry. Digests are now on demand (a staff
// click), and this test keeps every scheduled route away from the model.
//
// It walks the import graph TRANSITIVELY: the old cron never imported the LLM
// module itself — it imported lib/domain/digest, which did. A direct-import
// check would have passed on the exact route it exists to catch.

const ROOT = process.cwd();
const CRON_DIR = join(ROOT, "app", "api", "cron");
const LLM_MODULE = join(ROOT, "lib", "domain", "llm.ts");

/** A value (not type-only) import of ai-kit's model-calling entry points. */
const AI_KIT_CALL =
  /import\s+(?!type\b)(?:\*\s+as\s+\w+|\{[^}]*\b(?:complete|freeChain)\b[^}]*\})\s+from\s+["']@bitbaum\/ai-kit/;

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return entry === "route.ts" ? [full] : [];
  });
}

/** Local modules a file imports at runtime (`import type` is erased, so skipped). */
function localImports(file: string): string[] {
  const code = readFileSync(file, "utf8");
  const specs = [
    ...code.matchAll(/(?:import|export)\s+(?!type\b)[^;]*?from\s+["']([^"']+)["']/g),
    ...code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);
  return specs.flatMap((spec) => {
    const base = spec.startsWith("@/")
      ? join(ROOT, spec.slice(2))
      : spec.startsWith(".")
        ? join(dirname(file), spec)
        : null;
    if (!base) return [];
    const hit = [".ts", ".tsx", "/index.ts", "/index.tsx", ""]
      .map((ext) => base + ext)
      .find((p) => existsSync(p) && statSync(p).isFile());
    return hit ? [hit] : [];
  });
}

/** The import chain from `entry` to a model call, or null if there is none. */
function pathToModel(entry: string): string[] | null {
  const seen = new Set<string>();
  const stack: string[][] = [[entry]];
  while (stack.length > 0) {
    const chain = stack.pop()!;
    const file = chain[chain.length - 1];
    if (seen.has(file)) continue;
    seen.add(file);
    if (file === LLM_MODULE || AI_KIT_CALL.test(readFileSync(file, "utf8"))) {
      return chain.map((f) => relative(ROOT, f));
    }
    for (const next of localImports(file)) stack.push([...chain, next]);
  }
  return null;
}

const routes = routeFiles(CRON_DIR);

describe("cron routes never call a model", () => {
  it("finds the cron routes at all", () => {
    // A path typo would make every assertion below vacuously true.
    expect(routes.length).toBeGreaterThan(1);
  });

  it("the detector fires on a route that DOES reach the model", () => {
    // The on-demand digest route reaches callLLM via lib/domain/digest — the
    // same shape the old cron had. If this stops matching, the guard is blind.
    const onDemand = join(ROOT, "app", "api", "admin", "clients", "[id]", "digest", "route.ts");
    expect(pathToModel(onDemand)).toEqual([
      "app/api/admin/clients/[id]/digest/route.ts",
      "lib/domain/digest.ts",
      "lib/domain/llm.ts",
    ]);
  });

  it.each(routes)("%s does not reach lib/domain/llm or ai-kit complete/freeChain", (file) => {
    expect(pathToModel(file)).toBeNull();
  });
});
