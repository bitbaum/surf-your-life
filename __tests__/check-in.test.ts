import { describe, it, expect } from "vitest"
import {
  computeStreak,
  computeProgramProgress,
  detectMilestone,
  computeInsightKey,
  summariseCheckIns,
  CHECKIN_MILESTONES,
  STREAK_MILESTONES,
  type CheckInSummaryRow,
} from "@/lib/domain/check-in"

// ─── computeStreak ────────────────────────────────────────────────────────────

describe("computeStreak", () => {
  it("returns 0 for empty input", () => {
    expect(computeStreak([])).toBe(0)
  })

  it("returns 1 for a single check-in today", () => {
    const today = new Date()
    expect(computeStreak([today])).toBe(1)
  })

  it("returns 0 when last check-in was 2+ days ago", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    expect(computeStreak([threeDaysAgo])).toBe(0)
  })

  it("counts consecutive days ending today", () => {
    const today = new Date()
    const dates = [0, 1, 2].map(
      (i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    )
    expect(computeStreak(dates)).toBe(3)
  })

  it("breaks streak at a gap", () => {
    const today = new Date()
    const dates = [
      new Date(today.getFullYear(), today.getMonth(), today.getDate()),     // today
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), // yesterday
      // gap: -2 missing
      new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3), // 3 days ago
    ]
    expect(computeStreak(dates)).toBe(2)
  })

  it("deduplicates multiple check-ins on the same day", () => {
    const today = new Date()
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
    expect(computeStreak([today, today, yesterday, yesterday])).toBe(2)
  })

  it("counts streak ending yesterday (no check-in today yet)", () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dayBefore = new Date()
    dayBefore.setDate(dayBefore.getDate() - 2)
    expect(computeStreak([yesterday, dayBefore])).toBe(2)
  })
})

// ─── detectMilestone ─────────────────────────────────────────────────────────

describe("detectMilestone", () => {
  it("detects check-in milestones at exact counts", () => {
    for (const n of CHECKIN_MILESTONES) {
      expect(detectMilestone(n, 0)).toEqual({ type: "checkins", n })
    }
  })

  it("detects streak milestones at exact counts", () => {
    for (const n of STREAK_MILESTONES) {
      expect(detectMilestone(0, n)).toEqual({ type: "streak", n })
    }
  })

  it("returns null for non-milestone counts", () => {
    expect(detectMilestone(11, 0)).toBeNull()
    expect(detectMilestone(0, 8)).toBeNull()
    expect(detectMilestone(99, 99)).toBeNull()
  })

  it("prefers check-in milestone over streak milestone when both hit simultaneously", () => {
    // First milestone in each: 10 and 7
    const result = detectMilestone(10, 7)
    expect(result).toEqual({ type: "checkins", n: 10 })
  })

  it("returns null for zero counts", () => {
    expect(detectMilestone(0, 0)).toBeNull()
  })
})

// ─── computeInsightKey ───────────────────────────────────────────────────────

describe("computeInsightKey", () => {
  it("returns null for fewer than 3 data points", () => {
    expect(computeInsightKey([5, 6], 4)).toBeNull()
    expect(computeInsightKey([], 7)).toBeNull()
  })

  it("returns null when recent or oldest energy is null", () => {
    expect(computeInsightKey([null, 5, 6], 7)).toBeNull()
    expect(computeInsightKey([5, 5, null], 7)).toBeNull()
  })

  it("detects energy improvement (recent higher than old by ≥2)", () => {
    // [a, _, c] — a is most recent, c is oldest
    expect(computeInsightKey([7, 5, 5], 3)).toBe("insightEnergyUp")
    expect(computeInsightKey([9, 6, 6], 3)).toBe("insightEnergyUp")
  })

  it("does not trigger improvement for trend < 2", () => {
    expect(computeInsightKey([6, 5, 5], 3)).not.toBe("insightEnergyUp")
  })

  it("detects energy decline (recent lower than old by ≥2)", () => {
    expect(computeInsightKey([3, 5, 6], 3)).toBe("insightEnergyDown")
    expect(computeInsightKey([2, 5, 8], 3)).toBe("insightEnergyDown")
  })

  it("returns insightConsistent for 5+ check-ins with no trend", () => {
    expect(computeInsightKey([5, 5, 5], 5)).toBe("insightConsistent")
    expect(computeInsightKey([5, 5, 5], 7)).toBe("insightConsistent")
  })

  it("returns null when no trend and fewer than 5 weekly check-ins", () => {
    expect(computeInsightKey([5, 5, 5], 4)).toBeNull()
    expect(computeInsightKey([6, 5, 5], 3)).toBeNull() // trend=1, not ≥2
  })
})

// ─── computeProgramProgress ──────────────────────────────────────────────────

describe("computeProgramProgress", () => {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000

  function makeEnrollment(weeksAgo: number, durationWeeks: number, phaseConfig: unknown = null) {
    return {
      startDate: new Date(Date.now() - weeksAgo * WEEK_MS),
      program: {
        title: "Test Program",
        durationWeeks,
        phaseConfig,
      },
    }
  }

  it("returns null when startDate is null", () => {
    expect(
      computeProgramProgress({
        startDate: null,
        program: { title: "X", durationWeeks: 4, phaseConfig: null },
      })
    ).toBeNull()
  })

  it("returns null when program has completed (currentWeek > totalWeeks)", () => {
    const result = computeProgramProgress(makeEnrollment(5, 4))
    expect(result).toBeNull() // 5 weeks in, 4-week program → done
  })

  it("returns correct week number for an active program", () => {
    const result = computeProgramProgress(makeEnrollment(2, 8))
    expect(result).not.toBeNull()
    expect(result!.currentWeek).toBe(3) // 2 full weeks + current = week 3
    expect(result!.totalWeeks).toBe(8)
    expect(result!.programTitle).toBe("Test Program")
  })

  it("returns the matching phase for the current week", () => {
    const phases = [
      { week: 1, title: "Foundation", guidance: "..." },
      { week: 3, title: "Build", guidance: "..." },
    ]
    const result = computeProgramProgress(makeEnrollment(2, 8, phases))
    expect(result?.currentPhase?.title).toBe("Build")
  })

  it("returns null phase when no phase matches the current week", () => {
    const phases = [{ week: 1, title: "Foundation", guidance: "..." }]
    const result = computeProgramProgress(makeEnrollment(2, 8, phases))
    expect(result?.currentPhase).toBeNull() // week 3, only phase for week 1
  })
})

// ─── summariseCheckIns ────────────────────────────────────────────────────────

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
    expect(summariseCheckIns(rows)!.avgSleep).toBeNull()
  })

  it("computes avgSleep from non-null rows only", () => {
    const rows = [row({ sleepHours: null }), row({ sleepHours: 8 }), row({ sleepHours: null })]
    expect(summariseCheckIns(rows)!.avgSleep).toBe(8)
  })

  it("averages sleep hours across rows that have data", () => {
    const rows = [row({ sleepHours: 6 }), row({ sleepHours: 8 })]
    expect(summariseCheckIns(rows)!.avgSleep).toBe(7)
  })

  it("counts PEM flags correctly", () => {
    const rows = [row({ pemFlag: true }), row({ pemFlag: false }), row({ pemFlag: true })]
    expect(summariseCheckIns(rows)!.pemCount).toBe(2)
  })

  it("treats null pemFlag as no PEM", () => {
    const rows = [row({ pemFlag: null }), row({ pemFlag: true })]
    expect(summariseCheckIns(rows)!.pemCount).toBe(1)
  })

  it("maps mood values to numeric scores via MOOD_SCORE", () => {
    const good = summariseCheckIns([row({ mood: "good" })])!
    const low  = summariseCheckIns([row({ mood: "low" })])!
    expect(good.avgMoodNum).toBeGreaterThan(low.avgMoodNum)
  })

  it("defaults unknown mood to neutral score (3)", () => {
    expect(summariseCheckIns([row({ mood: "unknown_mood" })])!.avgMoodNum).toBe(3)
  })

  it("computes avgStress from non-null stress rows only", () => {
    const rows = [row({ stressLevel: null }), row({ stressLevel: 8 })]
    expect(summariseCheckIns(rows)!.avgStress).toBe(8)
  })

  it("returns avgStress 0 when all stressLevel are null", () => {
    expect(summariseCheckIns([row({ stressLevel: null })])!.avgStress).toBe(0)
  })

  it("returns avgMood string label matching the numeric score", () => {
    // neutral = score 3, good = score 4; average of 3+4=3.5 rounds to 4 → 'good'
    const rows = [row({ mood: "neutral" }), row({ mood: "good" })]
    expect(summariseCheckIns(rows)!.avgMood).toBe("good")
  })
})
