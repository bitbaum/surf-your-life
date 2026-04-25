import { DAY_MS, SEVEN_DAYS_MS, MOOD_SCORE, MOODS } from "@/lib/constants"
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
  | "insightEnergyUp"
  | "insightEnergyDown"
  | "insightConsistent"

export function computeInsightKey(
  recentEnergyLevels: (number | null)[],
  weekCheckInCount: number
): InsightKey | null {
  if (recentEnergyLevels.length < 3) return null
  const [a, , c] = recentEnergyLevels
  if (a == null || c == null) return null
  const trend = a - c
  if (trend >= 2) return "insightEnergyUp"
  if (trend <= -2) return "insightEnergyDown"
  if (weekCheckInCount >= 5) return "insightConsistent"
  return null
}
