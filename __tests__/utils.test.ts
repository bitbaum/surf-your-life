import { describe, it, expect } from "vitest"
import {
  formatEnumValue,
  toDateString,
  localDateString,
  buildLastNDayStrings,
  addDaysISO,
  dayKey,
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

// ─── dayKey ──────────────────────────────────────────────────────────────────
// Tests run with TZ=Europe/Zurich (vitest.config.ts) so local-day semantics
// reflect actual user experience.

describe("dayKey", () => {
  it("returns the same key for two times on the same local calendar day", () => {
    const morning = new Date(2026, 3, 25, 7, 0, 0)
    const evening = new Date(2026, 3, 25, 22, 30, 0)
    expect(dayKey(morning)).toBe(dayKey(evening))
  })

  it("returns keys exactly DAY_MS apart for consecutive local calendar days", () => {
    const a = new Date(2026, 3, 25, 12, 0, 0)
    const b = new Date(2026, 3, 26, 12, 0, 0)
    expect(dayKey(b) - dayKey(a)).toBe(86_400_000)
  })

  it("DST-safe: spring-forward day and the day after are exactly DAY_MS apart", () => {
    // 2026-03-29 is the DST jump in Europe — local midnight Mar 29 → Mar 30 is 23h
    // in wall-clock time, but dayKey UTC-anchors so the key delta is full DAY_MS.
    const dstDay = new Date(2026, 2, 29, 12, 0, 0)
    const nextDay = new Date(2026, 2, 30, 12, 0, 0)
    expect(dayKey(nextDay) - dayKey(dstDay)).toBe(86_400_000)
  })

  it("ignores time-of-day across the local calendar day", () => {
    const justAfterMidnight = new Date(2026, 3, 25, 0, 1, 0)
    const justBeforeMidnight = new Date(2026, 3, 25, 23, 59, 0)
    expect(dayKey(justAfterMidnight)).toBe(dayKey(justBeforeMidnight))
  })
})

// ─── localDateString ─────────────────────────────────────────────────────────

describe("localDateString", () => {
  it("returns the calendar day in CLINIC_TZ (Europe/Zurich) by default", () => {
    // 2026-04-26 12:00 UTC = 14:00 CEST → local day is 2026-04-26
    const noon = new Date(Date.UTC(2026, 3, 26, 12, 0, 0))
    expect(localDateString(noon)).toBe("2026-04-26")
  })

  it("rolls forward to the next local day for late-evening UTC times", () => {
    // 2026-04-25 22:30 UTC = 00:30 CEST on 2026-04-26 → local day is 2026-04-26
    const lateEveningUtc = new Date(Date.UTC(2026, 3, 25, 22, 30, 0))
    expect(localDateString(lateEveningUtc)).toBe("2026-04-26")
    // toDateString (UTC) would give the previous day — this is exactly the
    // bug the new helper exists to avoid.
    expect(toDateString(lateEveningUtc)).toBe("2026-04-25")
  })

  it("respects an explicit timezone override", () => {
    const sameMoment = new Date(Date.UTC(2026, 3, 26, 12, 0, 0))
    expect(localDateString(sameMoment, "Pacific/Auckland")).toBe("2026-04-27")
    expect(localDateString(sameMoment, "America/Los_Angeles")).toBe("2026-04-26")
  })
})

// ─── addDaysISO ──────────────────────────────────────────────────────────────

describe("addDaysISO", () => {
  it("adds N days to an ISO date string", () => {
    expect(addDaysISO("2026-04-25", 1)).toBe("2026-04-26")
    expect(addDaysISO("2026-04-25", 7)).toBe("2026-05-02")
    expect(addDaysISO("2026-04-25", -1)).toBe("2026-04-24")
  })

  it("handles month and year boundaries", () => {
    expect(addDaysISO("2026-04-30", 1)).toBe("2026-05-01")
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDaysISO("2026-03-01", -1)).toBe("2026-02-28")
  })

  it("DST-safe across spring-forward (was the offsetDate bug)", () => {
    // The previous lib/domain/techniques.ts:offsetDate used local-day setDate
    // arithmetic. In CET/CEST, addDaysISO("2026-03-29", 1) returned "2026-03-29"
    // (the same day) because the spring-forward shift made the local Date land
    // back on the same UTC date string. The UTC-stepped helper returns "2026-03-30".
    expect(addDaysISO("2026-03-28", 1)).toBe("2026-03-29")
    expect(addDaysISO("2026-03-29", 1)).toBe("2026-03-30")
    expect(addDaysISO("2026-03-29", -1)).toBe("2026-03-28")
  })

  it("DST-safe across fall-back", () => {
    expect(addDaysISO("2026-10-24", 1)).toBe("2026-10-25")
    expect(addDaysISO("2026-10-25", 1)).toBe("2026-10-26")
  })

  it("zero-offset is identity", () => {
    expect(addDaysISO("2026-04-25", 0)).toBe("2026-04-25")
  })
})

// ─── buildLastNDayStrings & SQL day-string consistency ──────────────────────
// Anchors the cadence pipeline: the sparkline labels (buildLastNDayStrings)
// and the per-check-in keys (localDateString) must agree on which day a
// late-night check-in falls on, otherwise the dot would show as hollow.

describe("buildLastNDayStrings × localDateString consistency", () => {
  it("a 00:30 local check-in's localDateString matches today's last day-string", () => {
    // It's 2026-04-26 14:00 in Zurich — the user just opened the dashboard.
    const now = new Date(Date.UTC(2026, 3, 26, 12, 0, 0))
    // The check-in was 13.5 hours ago: 00:30 local on 2026-04-26 = 22:30 UTC on 2026-04-25
    const earlyMorningCheckIn = new Date(Date.UTC(2026, 3, 25, 22, 30, 0))

    const sparkDays = buildLastNDayStrings(7, now)
    const checkInDay = localDateString(earlyMorningCheckIn)

    expect(sparkDays[6]).toBe("2026-04-26") // today
    expect(checkInDay).toBe("2026-04-26")    // same day, agrees
    expect(sparkDays).toContain(checkInDay)
  })
})
