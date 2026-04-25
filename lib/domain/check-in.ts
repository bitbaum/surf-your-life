import { DAY_MS, SEVEN_DAYS_MS, MOOD_SCORE, MOODS, ALERT_PEM_CLUSTER_COUNT } from "@/lib/constants"
import type { ProgramPhase } from "./program"

// ─── Check-in stats summary ────────────────────────────────────────────────

/** Minimal check-in shape required by summariseCheckIns. */
export type CheckInSummaryRow = {
  mood: string | null
  energyLevel: number | null
  sleepHours: number | null
  pemFlag: boolean | null
  stressLevel: number | null
}

/**
 * Aggregate a set of check-in rows into summary statistics.
 * Pure function — no DB access, no side effects.
 * Returns null for empty input.
 */
export function summariseCheckIns(rows: CheckInSummaryRow[]) {
  if (rows.length === 0) return null

  const avgEnergy = rows.reduce((s, r) => s + (r.energyLevel ?? 0), 0) / rows.length

  const sleepRows = rows.filter((r) => r.sleepHours != null)
  const avgSleep = sleepRows.length > 0
    ? sleepRows.reduce((s, r) => s + (r.sleepHours ?? 0), 0) / sleepRows.length
    : null

  const pemCount = rows.filter((r) => r.pemFlag).length

  const stressRows = rows.filter((r) => r.stressLevel != null)
  const avgStress = stressRows.length > 0
    ? stressRows.reduce((s, r) => s + (r.stressLevel ?? 0), 0) / stressRows.length
    : null

  const avgMoodNum = rows.reduce((s, r) => s + (MOOD_SCORE[r.mood ?? "neutral"] ?? 3), 0) / rows.length

  // Reverse-map numeric average back to a human-readable mood label
  const avgMoodScore = Math.round(avgMoodNum)
  const avgMood = MOODS.find((m) => MOOD_SCORE[m.value] === avgMoodScore)?.label.toLowerCase() ?? "neutral"

  return { avgEnergy, avgSleep, pemCount, avgStress, avgMoodNum, avgMood, count: rows.length }
}

// ─── Streak ────────────────────────────────────────────────────────────────

/** Consecutive days with at least one check-in, ending today or yesterday. */
export function computeStreak(checkInDates: Date[]): number {
  if (checkInDates.length === 0) return 0

  const days = checkInDates.map((d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  )
  const unique = [...new Set(days)].sort((a, b) => b - a)

  const today = new Date()
  const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  // Streak must end today or yesterday
  if (unique[0] !== todayMs && unique[0] !== todayMs - DAY_MS) return 0

  let s = 0
  let expected = unique[0] === todayMs ? todayMs : todayMs - DAY_MS
  for (const d of unique) {
    if (d === expected) { s++; expected -= DAY_MS }
    else break
  }
  return s
}

// ─── Return nudge ──────────────────────────────────────────────────────────

export type ReturnNudge =
  | { kind: "streak-keep"; streak: number; days: 1 }
  | { kind: "yesterday"; days: 1 }
  | { kind: "gap"; days: number }
  | { kind: "long-gap"; days: number }

/**
 * Decide which return nudge to show on the dashboard when the client
 * has not checked in today. Pure — `now` is injected for testability.
 * Returns null for first-time clients (caller falls back to the default copy).
 */
export function computeReturnNudge(
  lastCheckInDate: Date | null,
  streak: number,
  now: Date = new Date()
): ReturnNudge | null {
  if (!lastCheckInDate) return null

  // Anchor both calendar days to UTC midnight so DST transitions don't skew
  // the day count (otherwise spring-forward yields N-1 across the boundary).
  const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfLast = Date.UTC(
    lastCheckInDate.getFullYear(),
    lastCheckInDate.getMonth(),
    lastCheckInDate.getDate()
  )

  const days = Math.round((startOfToday - startOfLast) / DAY_MS)
  if (days <= 0) return null

  if (days === 1) {
    return streak >= 2
      ? { kind: "streak-keep", streak, days: 1 }
      : { kind: "yesterday", days: 1 }
  }
  if (days < 7) return { kind: "gap", days }
  return { kind: "long-gap", days }
}

// ─── Week-over-week delta ──────────────────────────────────────────────────

/** Minimal row shape required by computeWeekDelta. */
export type WeekDeltaRow = {
  createdAt: Date
  energyLevel: number
  pemFlag: boolean | null
  stressLevel: number | null
}

export type WeekAggregate = {
  avgEnergy: number | null
  pemCount: number
  avgStress: number | null
  count: number
}

export type WeekDelta = {
  window: WeekAggregate     // last 7 days (today and the 6 days before)
  prior: WeekAggregate      // the 7 days before the window
  energyDelta: number | null
  pemDelta: number          // current - prior; meaningful even with no prior window (= window count)
  stressDelta: number | null
  hasPriorWindow: boolean   // prior.count > 0
}

const round1 = (n: number) => Math.round(n * 10) / 10

function aggregateWeek(rows: WeekDeltaRow[]): WeekAggregate {
  const energyVals = rows.map((r) => r.energyLevel)
  const stressVals = rows.filter((r) => r.stressLevel != null).map((r) => r.stressLevel as number)
  return {
    avgEnergy: energyVals.length > 0
      ? energyVals.reduce((s, v) => s + v, 0) / energyVals.length
      : null,
    pemCount: rows.filter((r) => r.pemFlag === true).length,
    avgStress: stressVals.length > 0
      ? stressVals.reduce((s, v) => s + v, 0) / stressVals.length
      : null,
    count: rows.length,
  }
}

/**
 * Compare check-ins from the last 7 days against the 7 days before that.
 * Pure — `now` is injected for testability.
 * Day boundaries are anchored to UTC midnight so DST transitions don't shift buckets.
 */
export function computeWeekDelta(
  rows: WeekDeltaRow[],
  now: Date = new Date()
): WeekDelta {
  const startOfToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = startOfToday - 6 * DAY_MS    // include today + 6 days back = 7 days
  const fourteenDaysAgo = startOfToday - 13 * DAY_MS // prior window: 7 days, ending 7 days ago

  const dayOf = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())

  const windowRows = rows.filter((r) => {
    const d = dayOf(r.createdAt)
    return d >= sevenDaysAgo && d <= startOfToday
  })
  const priorRows = rows.filter((r) => {
    const d = dayOf(r.createdAt)
    return d >= fourteenDaysAgo && d < sevenDaysAgo
  })

  const window = aggregateWeek(windowRows)
  const prior = aggregateWeek(priorRows)

  return {
    window,
    prior,
    energyDelta: window.avgEnergy != null && prior.avgEnergy != null
      ? round1(window.avgEnergy - prior.avgEnergy)
      : null,
    pemDelta: window.pemCount - prior.pemCount,
    stressDelta: window.avgStress != null && prior.avgStress != null
      ? round1(window.avgStress - prior.avgStress)
      : null,
    hasPriorWindow: prior.count > 0,
  }
}

// ─── Program progress ──────────────────────────────────────────────────────

export type ProgramProgress = {
  currentWeek: number
  totalWeeks: number
  currentPhase: ProgramPhase | null
  programTitle: string
}

export function computeProgramProgress(enrollment: {
  startDate: Date | null
  program: {
    title: string
    durationWeeks: number | null
    phaseConfig: unknown
  }
}): ProgramProgress | null {
  if (!enrollment.startDate) return null

  const currentWeek = Math.floor((Date.now() - enrollment.startDate.getTime()) / SEVEN_DAYS_MS) + 1
  const totalWeeks = enrollment.program.durationWeeks ?? 0

  if (currentWeek < 1 || (totalWeeks > 0 && currentWeek > totalWeeks)) return null

  const phases = enrollment.program.phaseConfig as ProgramPhase[] | null
  const currentPhase = phases?.find((p) => p.week === currentWeek) ?? null

  return { currentWeek, totalWeeks, currentPhase, programTitle: enrollment.program.title }
}

// ─── Milestones ────────────────────────────────────────────────────────────

export const CHECKIN_MILESTONES = [10, 25, 50, 100, 250, 500] as const
export const STREAK_MILESTONES = [7, 14, 30, 60, 100] as const

export type MilestoneHit =
  | { type: "checkins"; n: number }
  | { type: "streak"; n: number }

export function detectMilestone(
  totalCheckIns: number,
  streak: number
): MilestoneHit | null {
  const ci = CHECKIN_MILESTONES.find((m) => totalCheckIns === m)
  if (ci) return { type: "checkins", n: ci }
  const s = STREAK_MILESTONES.find((m) => streak === m)
  if (s) return { type: "streak", n: s }
  return null
}

// ─── Rule-based insight ────────────────────────────────────────────────────

export type InsightKey =
  | "insightPemCluster"
  | "insightPemImproving"
  | "insightWeekStressUp"
  | "insightWeekStressDown"
  | "insightWeekEnergyUp"
  | "insightWeekEnergyDown"
  | "insightEnergyUp"
  | "insightEnergyDown"
  | "insightConsistent"

/** A keyed insight, optionally carrying numeric params for ICU interpolation. */
export type Insight =
  | { key: "insightPemCluster"; count: number }
  | { key: "insightWeekEnergyUp" | "insightWeekEnergyDown" | "insightWeekStressUp" | "insightWeekStressDown"; delta: number }
  | { key: "insightPemImproving" | "insightEnergyUp" | "insightEnergyDown" | "insightConsistent" }

const WEEK_DELTA_THRESHOLD = 1.0  // 1 point on the 10-scale weekly avg = meaningful

/**
 * Pick the most informative dashboard insight for the user.
 * Priority order (most actionable first):
 *   1. PEM cluster (clinical safety — uses the same 2+ threshold as practitioner alerts)
 *   2. PEM improving (positive reinforcement when recovering from a cluster week)
 *   3. Week-over-week stress UP (concerning — proximal to burnout)
 *   4. Week-over-week energy DOWN (concerning)
 *   5. Week-over-week energy UP (positive)
 *   6. Week-over-week stress DOWN (positive)
 *   7. Short-term direction across the last 3 check-ins (fallback)
 *   8. Consistency callout for clients checking in often (fallback)
 *
 * Concerning beats positive within each metric pair so the insight surfaces
 * what most needs attention. `weekDelta` is optional — falls back to
 * non-week behaviour when omitted.
 */
export function computeInsight(
  recentEnergyLevels: (number | null)[],
  weekCheckInCount: number,
  weekDelta: WeekDelta | null = null
): Insight | null {
  if (weekDelta) {
    // Cluster: 2+ PEM days in the current week, and not improving vs prior
    if (
      weekDelta.window.pemCount >= ALERT_PEM_CLUSTER_COUNT &&
      weekDelta.pemDelta >= 0
    ) {
      return { key: "insightPemCluster", count: weekDelta.window.pemCount }
    }

    // Improving: prior week had a cluster, current week is clearly down
    if (
      weekDelta.prior.pemCount >= ALERT_PEM_CLUSTER_COUNT &&
      weekDelta.pemDelta <= -1
    ) {
      return { key: "insightPemImproving" }
    }

    if (weekDelta.hasPriorWindow) {
      // Concerning signals first (stress up, energy down)
      if (weekDelta.stressDelta != null && weekDelta.stressDelta >= WEEK_DELTA_THRESHOLD) {
        return { key: "insightWeekStressUp", delta: weekDelta.stressDelta }
      }
      if (weekDelta.energyDelta != null && weekDelta.energyDelta <= -WEEK_DELTA_THRESHOLD) {
        return { key: "insightWeekEnergyDown", delta: Math.abs(weekDelta.energyDelta) }
      }
      // Positive signals next
      if (weekDelta.energyDelta != null && weekDelta.energyDelta >= WEEK_DELTA_THRESHOLD) {
        return { key: "insightWeekEnergyUp", delta: weekDelta.energyDelta }
      }
      if (weekDelta.stressDelta != null && weekDelta.stressDelta <= -WEEK_DELTA_THRESHOLD) {
        return { key: "insightWeekStressDown", delta: Math.abs(weekDelta.stressDelta) }
      }
    }
  }

  if (recentEnergyLevels.length >= 3) {
    const [a, , c] = recentEnergyLevels
    if (a != null && c != null) {
      const trend = a - c
      if (trend >= 2) return { key: "insightEnergyUp" }
      if (trend <= -2) return { key: "insightEnergyDown" }
    }
  }

  if (weekCheckInCount >= 5) return { key: "insightConsistent" }
  return null
}

/**
 * True when an insight is built on the week-over-week comparison —
 * the signals practitioners want at-a-glance. Excludes the short-term
 * 3-checkin nudges and the consistency callout, which are encouragement
 * for clients rather than actionable for admin.
 */
export function isComparativeInsight(insight: Insight): boolean {
  switch (insight.key) {
    case "insightPemCluster":
    case "insightPemImproving":
    case "insightWeekEnergyUp":
    case "insightWeekEnergyDown":
    case "insightWeekStressUp":
    case "insightWeekStressDown":
      return true
    default:
      return false
  }
}
