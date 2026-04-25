import { describe, it, expect } from "vitest"
import {
  formatEnumValue,
  toDateString,
  buildLastNDayStrings,
  parsePage,
  computeOffset,
  computeTotalPages,
} from "@/lib/utils"

// ─── formatEnumValue ──────────────────────────────────────────────────────────

describe("formatEnumValue", () => {
  it("converts snake_case to Title case", () => {
    expect(formatEnumValue("very_low")).toBe("Very low")
    expect(formatEnumValue("long_covid")).toBe("Long covid")
  })

  it("handles single-word values", () => {
    expect(formatEnumValue("active")).toBe("Active")
    expect(formatEnumValue("pending")).toBe("Pending")
  })

  it("handles multi-segment snake_case", () => {
    expect(formatEnumValue("brain_fog_mild")).toBe("Brain fog mild")
  })

  it("handles already-capitalised input gracefully", () => {
    expect(formatEnumValue("Active")).toBe("Active")
  })

  it("returns empty string for empty input", () => {
    expect(formatEnumValue("")).toBe("")
  })
})

// ─── toDateString ─────────────────────────────────────────────────────────────

describe("toDateString", () => {
  it("returns YYYY-MM-DD format", () => {
    expect(toDateString(new Date("2024-03-15T12:00:00Z"))).toBe("2024-03-15")
  })

  it("pads month and day with leading zeros", () => {
    expect(toDateString(new Date("2024-01-05T00:00:00Z"))).toBe("2024-01-05")
  })
})

// ─── parsePage ────────────────────────────────────────────────────────────────

describe("parsePage", () => {
  it("parses a valid page string", () => {
    expect(parsePage("3")).toBe(3)
    expect(parsePage("1")).toBe(1)
    expect(parsePage("10")).toBe(10)
  })

  it("returns 1 for undefined (no query param)", () => {
    expect(parsePage(undefined)).toBe(1)
  })

  it("returns 1 for non-numeric input", () => {
    expect(parsePage("abc")).toBe(1)
    expect(parsePage("")).toBe(1)
    expect(parsePage("1.5")).toBe(1) // parseInt("1.5") === 1, but parseInt("abc") === NaN → || 1
  })

  it("clamps zero and negative values to 1", () => {
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-5")).toBe(1)
  })
})

// ─── computeOffset ────────────────────────────────────────────────────────────

describe("computeOffset", () => {
  it("returns 0 for page 1", () => {
    expect(computeOffset(1, 20)).toBe(0)
  })

  it("returns pageSize for page 2", () => {
    expect(computeOffset(2, 20)).toBe(20)
  })

  it("computes correctly for arbitrary pages", () => {
    expect(computeOffset(3, 20)).toBe(40)
    expect(computeOffset(5, 10)).toBe(40)
  })
})

// ─── computeTotalPages ────────────────────────────────────────────────────────

describe("computeTotalPages", () => {
  it("returns 0 for 0 total rows", () => {
    expect(computeTotalPages(0, 20)).toBe(0)
  })

  it("returns 1 when total fits exactly in one page", () => {
    expect(computeTotalPages(20, 20)).toBe(1)
  })

  it("rounds up when items don't fill the last page", () => {
    expect(computeTotalPages(21, 20)).toBe(2)
    expect(computeTotalPages(1, 20)).toBe(1)
  })

  it("computes correctly for arbitrary sizes", () => {
    expect(computeTotalPages(100, 20)).toBe(5)
    expect(computeTotalPages(101, 20)).toBe(6)
    expect(computeTotalPages(99, 20)).toBe(5)
  })
})

// ─── buildLastNDayStrings ────────────────────────────────────────────────────

describe("buildLastNDayStrings", () => {
  it("returns N day strings, oldest first, ending today", () => {
    const now = new Date(Date.UTC(2026, 3, 25, 12, 0, 0))
    expect(buildLastNDayStrings(7, now)).toEqual([
      "2026-04-19",
      "2026-04-20",
      "2026-04-21",
      "2026-04-22",
      "2026-04-23",
      "2026-04-24",
      "2026-04-25",
    ])
  })

  it("crosses month boundaries cleanly", () => {
    const now = new Date(Date.UTC(2026, 4, 2, 9, 0, 0)) // 2026-05-02
    expect(buildLastNDayStrings(5, now)).toEqual([
      "2026-04-28",
      "2026-04-29",
      "2026-04-30",
      "2026-05-01",
      "2026-05-02",
    ])
  })

  it("DST-safe across spring-forward (Europe DST = March 29 2026)", () => {
    // Spans March 28 → April 3 — includes the DST transition. Should yield 7 distinct daily strings.
    const now = new Date(Date.UTC(2026, 3, 3, 12, 0, 0)) // 2026-04-03
    const days = buildLastNDayStrings(7, now)
    expect(days).toHaveLength(7)
    expect(new Set(days).size).toBe(7) // all distinct
    expect(days[0]).toBe("2026-03-28")
    expect(days[6]).toBe("2026-04-03")
  })

  it("returns N=1 as just today", () => {
    const now = new Date(Date.UTC(2026, 3, 25, 12, 0, 0))
    expect(buildLastNDayStrings(1, now)).toEqual(["2026-04-25"])
  })
})
