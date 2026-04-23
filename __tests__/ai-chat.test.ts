/**
 * Unit tests for the summariseCheckIns function in lib/domain/check-in.
 *
 * check-in.ts is pure — no DB or network calls, no mocks required.
 */
import { describe, it, expect } from "vitest"

import { summariseCheckIns, type CheckInSummaryRow } from "@/lib/domain/check-in"

// ─── helpers ──────────────────────────────────────────────────────────────────

function row(overrides: Partial<CheckInSummaryRow> = {}): CheckInSummaryRow {
  return {
    mood: "neutral",
    energyLevel: 5,
    sleepHours: null,
    pemFlag: false,
    stressLevel: null,
    ...overrides,
  }
}

// ─── summariseCheckIns ────────────────────────────────────────────────────────

describe("summariseCheckIns", () => {
  it("returns null for empty input", () => {
    expect(summariseCheckIns([])).toBeNull()
  })

  it("computes avgEnergy correctly", () => {
    const rows = [row({ energyLevel: 4 }), row({ energyLevel: 6 })]
    const stats = summariseCheckIns(rows)!
    expect(stats.avgEnergy).toBe(5)
    expect(stats.count).toBe(2)
  })

  it("returns avgSleep null when no row has sleepHours", () => {
    const rows = [row({ sleepHours: null }), row({ sleepHours: null })]
    const stats = summariseCheckIns(rows)!
    expect(stats.avgSleep).toBeNull()
  })

  it("returns avgSleep null for a mix of null and non-null but still computes from non-null only", () => {
    const rows = [row({ sleepHours: null }), row({ sleepHours: 8 }), row({ sleepHours: null })]
    const stats = summariseCheckIns(rows)!
    expect(stats.avgSleep).toBe(8)
  })

  it("averages sleep hours across rows that have data", () => {
    const rows = [row({ sleepHours: 6 }), row({ sleepHours: 8 })]
    const stats = summariseCheckIns(rows)!
    expect(stats.avgSleep).toBe(7)
  })

  it("counts PEM flags correctly", () => {
    const rows = [
      row({ pemFlag: true }),
      row({ pemFlag: false }),
      row({ pemFlag: true }),
    ]
    expect(summariseCheckIns(rows)!.pemCount).toBe(2)
  })

  it("treats null pemFlag as no PEM", () => {
    const rows = [row({ pemFlag: null }), row({ pemFlag: true })]
    expect(summariseCheckIns(rows)!.pemCount).toBe(1)
  })

  it("maps mood values to numeric scores via MOOD_SCORE", () => {
    // 'good' should score higher than 'low'
    const good = summariseCheckIns([row({ mood: "good" })])!
    const low  = summariseCheckIns([row({ mood: "low" })])!
    expect(good.avgMoodNum).toBeGreaterThan(low.avgMoodNum)
  })

  it("defaults unknown mood to neutral score (3)", () => {
    const stats = summariseCheckIns([row({ mood: "unknown_mood" })])!
    expect(stats.avgMoodNum).toBe(3)
  })

  it("computes avgStress from non-null stress rows only", () => {
    const rows = [row({ stressLevel: null }), row({ stressLevel: 8 })]
    const stats = summariseCheckIns(rows)!
    expect(stats.avgStress).toBe(8)
  })

  it("returns avgStress 0 when all stressLevel are null (no false positives in branches that guard first)", () => {
    // The stress branch in ruleBasedResponse guards for stressRows.length === 0
    // before using stats.avgStress, so avgStress=0 is only used in a guarded context
    const rows = [row({ stressLevel: null })]
    const stats = summariseCheckIns(rows)!
    expect(stats.avgStress).toBe(0)
  })
})
