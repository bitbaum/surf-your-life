import { describe, it, expect } from "vitest"
import {
  computeStreak,
  computeProgramProgress,
  computeReturnNudge,
  computeWeekDelta,
  detectMilestone,
  computeInsight,
  isComparativeInsight,
  summariseCheckIns,
  CHECKIN_MILESTONES,
  STREAK_MILESTONES,
  type CheckInSummaryRow,
  type WeekDelta,
  type WeekDeltaRow,
} from "@/lib/domain/check-in"

const emptyAggregate = { avgEnergy: null, pemCount: 0, avgStress: null, count: 0 }
const noWeekDelta: WeekDelta = {
  window: emptyAggregate,
  prior: emptyAggregate,
  energyDelta: null,
  pemDelta: 0,
  stressDelta: null,
  hasPriorWindow: false,
}
function weekDeltaWithEnergy(currentAvg: number, priorAvg: number, currentCount = 5, priorCount = 5): WeekDelta {
  return {
    window: { avgEnergy: currentAvg, pemCount: 0, avgStress: null, count: currentCount },
    prior: { avgEnergy: priorAvg, pemCount: 0, avgStress: null, count: priorCount },
    energyDelta: Math.round((currentAvg - priorAvg) * 10) / 10,
    pemDelta: 0,
    stressDelta: null,
    hasPriorWindow: priorCount > 0,
  }
}

function weekDeltaWithPem(currentPem: number, priorPem: number, currentCount = 5, priorCount = 5): WeekDelta {
  return {
    window: { avgEnergy: 5, pemCount: currentPem, avgStress: null, count: currentCount },
    prior: { avgEnergy: 5, pemCount: priorPem, avgStress: null, count: priorCount },
    energyDelta: 0,
    pemDelta: currentPem - priorPem,
    stressDelta: null,
    hasPriorWindow: priorCount > 0,
  }
}

function weekDeltaWithStress(currentAvg: number, priorAvg: number, currentCount = 5, priorCount = 5): WeekDelta {
  return {
    window: { avgEnergy: 5, pemCount: 0, avgStress: currentAvg, count: currentCount },
    prior: { avgEnergy: 5, pemCount: 0, avgStress: priorAvg, count: priorCount },
    energyDelta: 0,
    pemDelta: 0,
    stressDelta: Math.round((currentAvg - priorAvg) * 10) / 10,
    hasPriorWindow: priorCount > 0,
  }
}
import { DAY_MS, SEVEN_DAYS_MS } from "@/lib/constants"

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
    const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS)
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

// ─── computeReturnNudge ──────────────────────────────────────────────────────

describe("computeReturnNudge", () => {
  // Anchor `now` at noon to keep the "start of day" math far from boundaries
  const now = new Date(2026, 3, 25, 12, 0, 0)
  const dayAt = (offset: number, hour = 9) =>
    new Date(2026, 3, 25 + offset, hour, 0, 0)

  it("returns null for first-time clients (no last check-in)", () => {
    expect(computeReturnNudge(null, 0, now)).toBeNull()
  })

  it("returns null when last check-in was today (caller should not call this)", () => {
    expect(computeReturnNudge(dayAt(0), 1, now)).toBeNull()
  })

  it("returns streak-keep when last was yesterday and streak >= 2", () => {
    expect(computeReturnNudge(dayAt(-1), 5, now)).toEqual({
      kind: "streak-keep",
      streak: 5,
      days: 1,
    })
  })

  it("returns yesterday (no streak) when last was yesterday and streak < 2", () => {
    expect(computeReturnNudge(dayAt(-1), 1, now)).toEqual({
      kind: "yesterday",
      days: 1,
    })
  })

  it("returns gap for 2-6 day absences", () => {
    expect(computeReturnNudge(dayAt(-3), 0, now)).toEqual({ kind: "gap", days: 3 })
    expect(computeReturnNudge(dayAt(-6), 0, now)).toEqual({ kind: "gap", days: 6 })
  })

  it("returns long-gap for absences of 7+ days", () => {
    expect(computeReturnNudge(dayAt(-7), 0, now)).toEqual({ kind: "long-gap", days: 7 })
    expect(computeReturnNudge(dayAt(-30), 0, now)).toEqual({ kind: "long-gap", days: 30 })
  })

  it("ignores time-of-day when computing the day gap", () => {
    // Last check-in late yesterday, "now" is early morning today → still 1 day
    const lastLateYesterday = new Date(2026, 3, 24, 23, 30, 0)
    const earlyToday = new Date(2026, 3, 25, 0, 30, 0)
    expect(computeReturnNudge(lastLateYesterday, 3, earlyToday)).toEqual({
      kind: "streak-keep",
      streak: 3,
      days: 1,
    })
  })

  // ─── DST safety ────────────────────────────────────────────────────────────
  // European DST 2026: spring-forward Sun 2026-03-29, fall-back Sun 2026-10-25.
  // The function pins both timestamps to UTC midnight of their local calendar
  // date, so day-counting must stay exact across these transitions.

  it("DST-safe: 2-day gap spanning the spring-forward transition", () => {
    // Sat 2026-03-28 → Mon 2026-03-30 = 2 calendar days (DST starts in between)
    const lastBefore = new Date(2026, 2, 28, 9, 0, 0)
    const nowAfter = new Date(2026, 2, 30, 12, 0, 0)
    expect(computeReturnNudge(lastBefore, 0, nowAfter)).toEqual({ kind: "gap", days: 2 })
  })

  it("DST-safe: 7-day gap spanning spring-forward yields exactly 7 days (long-gap)", () => {
    // Wed 2026-03-25 → Wed 2026-04-01 = 7 calendar days
    const last = new Date(2026, 2, 25, 9, 0, 0)
    const nowAfter = new Date(2026, 3, 1, 9, 0, 0)
    expect(computeReturnNudge(last, 0, nowAfter)).toEqual({ kind: "long-gap", days: 7 })
  })

  it("DST-safe: yesterday across the spring-forward boundary", () => {
    // Last: late Sat 2026-03-28 23:30. Now: Sun 2026-03-29 12:00 (post-DST).
    const last = new Date(2026, 2, 28, 23, 30, 0)
    const nowDstDay = new Date(2026, 2, 29, 12, 0, 0)
    expect(computeReturnNudge(last, 3, nowDstDay)).toEqual({
      kind: "streak-keep",
      streak: 3,
      days: 1,
    })
  })

  it("DST-safe: 2-day gap spanning the fall-back transition", () => {
    // Sat 2026-10-24 → Mon 2026-10-26 = 2 calendar days (DST ends in between)
    const lastBefore = new Date(2026, 9, 24, 9, 0, 0)
    const nowAfter = new Date(2026, 9, 26, 12, 0, 0)
    expect(computeReturnNudge(lastBefore, 0, nowAfter)).toEqual({ kind: "gap", days: 2 })
  })
})

// ─── computeWeekDelta ────────────────────────────────────────────────────────

describe("computeWeekDelta", () => {
  const now = new Date(2026, 3, 25, 12, 0, 0)
  const dayAt = (offset: number, hour = 9): Date =>
    new Date(2026, 3, 25 + offset, hour, 0, 0)
  const row = (offset: number, fields: Partial<WeekDeltaRow> = {}): WeekDeltaRow => ({
    createdAt: dayAt(offset),
    energyLevel: 5,
    pemFlag: false,
    stressLevel: null,
    ...fields,
  })

  it("returns empty aggregates when there are no rows", () => {
    const r = computeWeekDelta([], now)
    expect(r.window).toEqual({ avgEnergy: null, pemCount: 0, avgStress: null, count: 0 })
    expect(r.prior).toEqual({ avgEnergy: null, pemCount: 0, avgStress: null, count: 0 })
    expect(r.energyDelta).toBeNull()
    expect(r.pemDelta).toBe(0)
    expect(r.hasPriorWindow).toBe(false)
  })

  it("buckets rows into the correct 7-day window", () => {
    // Window: -6..0 (today). Prior: -13..-7. Anything older or in the future is excluded.
    const r = computeWeekDelta(
      [
        row(0, { energyLevel: 8 }),
        row(-3, { energyLevel: 6 }),
        row(-6, { energyLevel: 4 }),
        row(-7, { energyLevel: 5 }),   // boundary → prior
        row(-13, { energyLevel: 3 }),  // boundary → prior
        row(-14, { energyLevel: 9 }),  // out of both windows
      ],
      now
    )
    expect(r.window.count).toBe(3)
    expect(r.prior.count).toBe(2)
  })

  it("computes avg energy and pem count correctly per window", () => {
    const r = computeWeekDelta(
      [
        row(0, { energyLevel: 7, pemFlag: true }),
        row(-1, { energyLevel: 5 }),
        row(-7, { energyLevel: 6, pemFlag: true }),
        row(-8, { energyLevel: 4, pemFlag: true }),
      ],
      now
    )
    expect(r.window.avgEnergy).toBe(6)
    expect(r.window.pemCount).toBe(1)
    expect(r.prior.avgEnergy).toBe(5)
    expect(r.prior.pemCount).toBe(2)
    expect(r.energyDelta).toBe(1)
    expect(r.pemDelta).toBe(-1)
  })

  it("handles null stress values without poisoning the average", () => {
    const r = computeWeekDelta(
      [
        row(0, { stressLevel: 8 }),
        row(-1, { stressLevel: null }),
        row(-2, { stressLevel: 6 }),
        row(-7, { stressLevel: 4 }),
        row(-8, { stressLevel: null }),
      ],
      now
    )
    expect(r.window.avgStress).toBe(7)   // (8 + 6) / 2
    expect(r.prior.avgStress).toBe(4)
    expect(r.stressDelta).toBe(3)
  })

  it("returns null deltas when one side has no data for that metric", () => {
    const r = computeWeekDelta([row(0, { stressLevel: 7 })], now)
    expect(r.energyDelta).toBeNull()    // prior has 0 rows
    expect(r.stressDelta).toBeNull()
    expect(r.pemDelta).toBe(0)          // counts: 0 - 0
    expect(r.hasPriorWindow).toBe(false)
  })

  it("rounds delta values to one decimal place", () => {
    const r = computeWeekDelta(
      [
        row(0, { energyLevel: 7 }),
        row(-1, { energyLevel: 8 }),
        row(-2, { energyLevel: 7 }),  // window avg = 7.333...
        row(-7, { energyLevel: 5 }),
        row(-8, { energyLevel: 6 }),  // prior avg = 5.5
      ],
      now
    )
    expect(r.energyDelta).toBe(1.8)   // 7.333... - 5.5 = 1.833... → 1.8
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

// ─── computeInsight ──────────────────────────────────────────────────────────

describe("computeInsight", () => {
  it("returns null when there's not enough data and no consistency signal", () => {
    expect(computeInsight([5, 6], 4)).toBeNull()
    expect(computeInsight([], 4)).toBeNull()
    expect(computeInsight([5, 6], 4, noWeekDelta)).toBeNull()
  })

  it("returns null when recent or oldest energy is null and no other signal applies", () => {
    expect(computeInsight([null, 5, 6], 4)).toBeNull()
    expect(computeInsight([5, 5, null], 4)).toBeNull()
  })

  it("falls back to short-term up trend when there's no prior week", () => {
    expect(computeInsight([7, 5, 5], 3)).toEqual({ key: "insightEnergyUp" })
    expect(computeInsight([9, 6, 6], 3, noWeekDelta)).toEqual({ key: "insightEnergyUp" })
  })

  it("falls back to short-term down trend when there's no prior week", () => {
    expect(computeInsight([3, 5, 6], 3)).toEqual({ key: "insightEnergyDown" })
    expect(computeInsight([2, 5, 8], 3, noWeekDelta)).toEqual({ key: "insightEnergyDown" })
  })

  it("does not fire short-term trend when the swing is < 2", () => {
    expect(computeInsight([6, 5, 5], 3)).toBeNull()
  })

  it("returns insightConsistent for 5+ weekly check-ins with no trend", () => {
    expect(computeInsight([5, 5, 5], 5)).toEqual({ key: "insightConsistent" })
    expect(computeInsight([5, 5, 5], 7)).toEqual({ key: "insightConsistent" })
  })

  it("returns null when no trend and fewer than 5 weekly check-ins", () => {
    expect(computeInsight([5, 5, 5], 4)).toBeNull()
  })

  it("prefers week-over-week energy up when delta ≥ 1.0 and prior window exists", () => {
    // Short-term would say nothing; week says up
    const insight = computeInsight([6, 6, 6], 5, weekDeltaWithEnergy(6.5, 5.0))
    expect(insight).toEqual({ key: "insightWeekEnergyUp", delta: 1.5 })
  })

  it("prefers week-over-week energy down when delta ≤ -1.0", () => {
    const insight = computeInsight([5, 5, 5], 5, weekDeltaWithEnergy(4.0, 5.5))
    expect(insight).toEqual({ key: "insightWeekEnergyDown", delta: 1.5 })
  })

  it("week signal overrides a contradictory short-term signal", () => {
    // Last 3: 7,5,5 → short-term would say up. But week is clearly down.
    const insight = computeInsight([7, 5, 5], 5, weekDeltaWithEnergy(4.0, 6.0))
    expect(insight).toEqual({ key: "insightWeekEnergyDown", delta: 2 })
  })

  it("does not fire week-over-week below the 1.0 threshold", () => {
    // delta = 0.8 → not enough; falls back to short-term (which here also doesn't fire) → consistency
    const insight = computeInsight([5, 5, 5], 5, weekDeltaWithEnergy(5.8, 5.0))
    expect(insight).toEqual({ key: "insightConsistent" })
  })

  it("ignores the prior window when it has no data", () => {
    // hasPriorWindow=false → week signal cannot fire even if energyDelta were defined
    const noPrior = weekDeltaWithEnergy(7.0, 5.0, 5, 0)
    expect(noPrior.hasPriorWindow).toBe(false)
    const insight = computeInsight([7, 5, 5], 5, noPrior)
    expect(insight).toEqual({ key: "insightEnergyUp" })  // falls back to short-term
  })

  it("fires PEM cluster at the practitioner-alert threshold (2+) when not improving", () => {
    // 2 this week, 0 last week — clear cluster emergence
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithPem(2, 0))).toEqual({
      key: "insightPemCluster",
      count: 2,
    })
    // 3 this week, 1 last week — rising cluster
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithPem(3, 1))).toEqual({
      key: "insightPemCluster",
      count: 3,
    })
    // 2 this week, 2 last week — persistent cluster (delta=0)
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithPem(2, 2))).toEqual({
      key: "insightPemCluster",
      count: 2,
    })
  })

  it("fires PEM cluster even with no prior week data (newcomer with 2+ crashes)", () => {
    // No prior data; 2+ PEM is still clinically actionable
    const noPriorCluster = weekDeltaWithPem(2, 0, 5, 0)
    expect(noPriorCluster.hasPriorWindow).toBe(false)
    expect(computeInsight([5, 5, 5], 5, noPriorCluster)).toEqual({
      key: "insightPemCluster",
      count: 2,
    })
  })

  it("fires PEM improving when last week had a cluster and this week is clearly down", () => {
    // 2 last week, 0 this week
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithPem(0, 2))).toEqual({ key: "insightPemImproving" })
    // 3 last week, 1 this week (delta=-2)
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithPem(1, 3))).toEqual({ key: "insightPemImproving" })
  })

  it("does not fire PEM improving when current week is still in cluster territory", () => {
    // 3 last week, 2 this week — current is at cluster threshold, cluster wins
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithPem(2, 3))).toEqual({
      key: "insightPemImproving",
    })
    // (delta=-1, prior >= 2 → improving fires; window.pemCount=2 also matches cluster path
    // but pemDelta=-1 fails cluster's "pemDelta >= 0" guard, so improving correctly wins)
  })

  it("PEM cluster outranks week energy down", () => {
    // Cluster present AND energy down — clinical safety wins
    const delta: WeekDelta = {
      window: { avgEnergy: 4, pemCount: 2, avgStress: null, count: 5 },
      prior: { avgEnergy: 6, pemCount: 0, avgStress: null, count: 5 },
      energyDelta: -2,
      pemDelta: 2,
      stressDelta: null,
      hasPriorWindow: true,
    }
    expect(computeInsight([4, 4, 4], 5, delta)).toEqual({ key: "insightPemCluster", count: 2 })
  })

  it("fires week stress up when stress is climbing ≥ 1.0", () => {
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithStress(7.5, 5.0))).toEqual({
      key: "insightWeekStressUp",
      delta: 2.5,
    })
  })

  it("fires week stress down when stress is dropping ≤ -1.0", () => {
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithStress(4.0, 6.5))).toEqual({
      key: "insightWeekStressDown",
      delta: 2.5,
    })
  })

  it("does not fire stress branches below the 1.0 threshold", () => {
    // delta = 0.8 → no stress signal; falls back to consistency
    expect(computeInsight([5, 5, 5], 5, weekDeltaWithStress(5.8, 5.0))).toEqual({
      key: "insightConsistent",
    })
  })

  it("stress UP outranks energy DOWN (concerning > concerning, stress is more proximal)", () => {
    const delta: WeekDelta = {
      window: { avgEnergy: 4, pemCount: 0, avgStress: 7, count: 5 },
      prior: { avgEnergy: 6, pemCount: 0, avgStress: 5, count: 5 },
      energyDelta: -2,
      pemDelta: 0,
      stressDelta: 2,
      hasPriorWindow: true,
    }
    expect(computeInsight([4, 4, 4], 5, delta)).toEqual({
      key: "insightWeekStressUp",
      delta: 2,
    })
  })

  it("energy DOWN outranks energy UP outranks stress DOWN (concerning > positive)", () => {
    // Energy up + stress down (both positive); energy up wins
    const positiveOnly: WeekDelta = {
      window: { avgEnergy: 7, pemCount: 0, avgStress: 4, count: 5 },
      prior: { avgEnergy: 5, pemCount: 0, avgStress: 6, count: 5 },
      energyDelta: 2,
      pemDelta: 0,
      stressDelta: -2,
      hasPriorWindow: true,
    }
    expect(computeInsight([7, 7, 7], 5, positiveOnly)).toEqual({
      key: "insightWeekEnergyUp",
      delta: 2,
    })
  })

  it("PEM cluster still outranks both stress and energy concerning signals", () => {
    const delta: WeekDelta = {
      window: { avgEnergy: 4, pemCount: 2, avgStress: 8, count: 5 },
      prior: { avgEnergy: 6, pemCount: 0, avgStress: 5, count: 5 },
      energyDelta: -2,
      pemDelta: 2,
      stressDelta: 3,
      hasPriorWindow: true,
    }
    expect(computeInsight([4, 4, 4], 5, delta)).toEqual({ key: "insightPemCluster", count: 2 })
  })
})

// ─── isComparativeInsight ────────────────────────────────────────────────────

describe("isComparativeInsight", () => {
  it("returns true for week-over-week and PEM signals", () => {
    expect(isComparativeInsight({ key: "insightPemCluster", count: 2 })).toBe(true)
    expect(isComparativeInsight({ key: "insightPemImproving" })).toBe(true)
    expect(isComparativeInsight({ key: "insightWeekEnergyUp", delta: 1.2 })).toBe(true)
    expect(isComparativeInsight({ key: "insightWeekEnergyDown", delta: 1.5 })).toBe(true)
    expect(isComparativeInsight({ key: "insightWeekStressUp", delta: 1.8 })).toBe(true)
    expect(isComparativeInsight({ key: "insightWeekStressDown", delta: 1.2 })).toBe(true)
  })

  it("returns false for short-term and consistency signals", () => {
    expect(isComparativeInsight({ key: "insightEnergyUp" })).toBe(false)
    expect(isComparativeInsight({ key: "insightEnergyDown" })).toBe(false)
    expect(isComparativeInsight({ key: "insightConsistent" })).toBe(false)
  })
})

// ─── computeProgramProgress ──────────────────────────────────────────────────

describe("computeProgramProgress", () => {
  function makeEnrollment(weeksAgo: number, durationWeeks: number, phaseConfig: unknown = null) {
    return {
      startDate: new Date(Date.now() - weeksAgo * SEVEN_DAYS_MS),
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

  it("returns avgStress null when all stressLevel are null", () => {
    expect(summariseCheckIns([row({ stressLevel: null })])!.avgStress).toBeNull()
  })

  it("returns avgMood string label matching the numeric score", () => {
    // neutral = score 3, good = score 4; average of 3+4=3.5 rounds to 4 → 'good'
    const rows = [row({ mood: "neutral" }), row({ mood: "good" })]
    expect(summariseCheckIns(rows)!.avgMood).toBe("good")
  })
})
