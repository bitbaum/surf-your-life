import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

// ─── Every cron route goes through verifyCronAuth ────────────────────────────
//
// Fixing the helper fixes today's four routes; asserting it against the
// directory fixes the fifth one nobody has written yet — which will be written
// by copying an existing route, exactly how a fail-open check would spread. A
// route that reads process.env.CRON_SECRET itself, or that never calls
// verifyCronAuth, fails this test.

const CRON_DIR = join(process.cwd(), "app", "api", "cron")

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return routeFiles(full)
    return entry === "route.ts" ? [full] : []
  })
}

const routes = routeFiles(CRON_DIR)

describe("cron routes are uniformly guarded", () => {
  it("finds the cron routes at all", () => {
    // A path typo would make every assertion below vacuously true.
    expect(routes.length).toBeGreaterThan(2)
  })

  it.each(routes)("%s calls verifyCronAuth", (file) => {
    expect(readFileSync(file, "utf8")).toContain("verifyCronAuth")
  })

  it.each(routes)("%s does not read CRON_SECRET itself", (file) => {
    const code = readFileSync(file, "utf8")
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("*") && !l.trimStart().startsWith("//"))
      .join("\n")
    expect(code).not.toMatch(/process\.env\.CRON_SECRET/)
  })
})
