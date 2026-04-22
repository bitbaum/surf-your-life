import { DAY_MS } from "@/lib/constants"
import type { ProgramPhase } from "./program"

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

  const currentWeek = Math.floor((Date.now() - enrollment.startDate.getTime()) / (7 * DAY_MS)) + 1
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
