import { describe, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

// Loads /messages/<locale>.json and returns its parsed contents.
type Json = string | number | boolean | null | { [k: string]: Json } | Json[]

function loadLocale(name: string): Json {
  const p = resolve(process.cwd(), "messages", `${name}.json`)
  return JSON.parse(readFileSync(p, "utf8")) as Json
}

// Walks a nested object, returning every leaf path joined with dots.
// Arrays are treated as leaves so the structure of array-shaped values
// (e.g. enum option lists) is compared as a whole rather than per index.
function collectLeafPaths(node: Json, prefix = ""): string[] {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    return prefix ? [prefix] : []
  }
  const out: string[] = []
  for (const [k, v] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${k}` : k
    out.push(...collectLeafPaths(v, path))
  }
  return out
}

function getLeafValue(node: Json, path: string): Json | undefined {
  return path.split(".").reduce<Json | undefined>((acc, k) => {
    if (acc != null && typeof acc === "object" && !Array.isArray(acc)) {
      return acc[k]
    }
    return undefined
  }, node)
}

// Extracts ICU placeholder identifiers like `{name}` or `{count, plural, ...}`
// from a translation string. Returns the set of identifier names.
function extractPlaceholders(s: string): Set<string> {
  const out = new Set<string>()
  const re = /\{(\w+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) out.add(m[1])
  return out
}

describe("i18n key parity", () => {
  const en = loadLocale("en")
  const de = loadLocale("de")
  const fr = loadLocale("fr")
  const enPaths = new Set(collectLeafPaths(en))
  const dePaths = new Set(collectLeafPaths(de))
  const frPaths = new Set(collectLeafPaths(fr))

  it("de has every key that en has", () => {
    const missing = [...enPaths].filter((p) => !dePaths.has(p)).sort()
    if (missing.length > 0) {
      throw new Error(`${missing.length} key(s) missing in de:\n  ${missing.join("\n  ")}`)
    }
  })

  it("fr has every key that en has", () => {
    const missing = [...enPaths].filter((p) => !frPaths.has(p)).sort()
    if (missing.length > 0) {
      throw new Error(`${missing.length} key(s) missing in fr:\n  ${missing.join("\n  ")}`)
    }
  })

  it("en has every key that de has (no orphan de translations)", () => {
    const orphans = [...dePaths].filter((p) => !enPaths.has(p)).sort()
    if (orphans.length > 0) {
      throw new Error(`${orphans.length} key(s) in de but not en:\n  ${orphans.join("\n  ")}`)
    }
  })

  it("en has every key that fr has (no orphan fr translations)", () => {
    const orphans = [...frPaths].filter((p) => !enPaths.has(p)).sort()
    if (orphans.length > 0) {
      throw new Error(`${orphans.length} key(s) in fr but not en:\n  ${orphans.join("\n  ")}`)
    }
  })

  it("string values use the same placeholder identifiers across locales", () => {
    const issues: string[] = []
    for (const path of enPaths) {
      const enVal = getLeafValue(en, path)
      if (typeof enVal !== "string") continue
      const enPh = extractPlaceholders(enVal)
      for (const [name, locale] of [
        ["de", de] as const,
        ["fr", fr] as const,
      ]) {
        const localeVal = getLeafValue(locale, path)
        if (typeof localeVal !== "string") continue
        const otherPh = extractPlaceholders(localeVal)
        const missing = [...enPh].filter((p) => !otherPh.has(p))
        const extra = [...otherPh].filter((p) => !enPh.has(p))
        if (missing.length || extra.length) {
          issues.push(
            `  ${path} (${name}) — missing=[${missing.join(",") || "—"}] extra=[${extra.join(",") || "—"}]`
          )
        }
      }
    }
    if (issues.length > 0) {
      throw new Error(`Placeholder mismatches:\n${issues.join("\n")}`)
    }
  })
})
