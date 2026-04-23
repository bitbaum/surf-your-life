import { z } from "zod"
import { techniqueCategoryEnum, techniqueDifficultyEnum } from "@/lib/db/schema"
import { toDateString } from "@/lib/utils"
import {
  TECHNIQUE_DEFAULT_FREQUENCY,
  TECHNIQUE_DEFAULT_MAX_DEBT_DAYS,
  TECHNIQUE_DEFAULT_SAFETY_CAP,
  TECHNIQUE_DAILY_FREQUENCY_MAX,
  TECHNIQUE_DURATION_MINUTES,
  TECHNIQUE_NAME_MAX,
  FIELD_MAX_NOTES,
  FIELD_MAX_LONG,
} from "@/lib/constants"

// ─── Zod schemas (SSOT for input validation) ─────────────────────────────────

export const createTechniqueSchema = z.object({
  name: z.string().min(1).max(TECHNIQUE_NAME_MAX),
  description: z.string().max(FIELD_MAX_NOTES).optional(),
  category: z.enum(techniqueCategoryEnum.enumValues),
  instructions: z.string().max(FIELD_MAX_LONG).optional(),
  durationMinutes: z.number().int().min(TECHNIQUE_DURATION_MINUTES.min).max(TECHNIQUE_DURATION_MINUTES.max).optional(),
  difficulty: z.enum(techniqueDifficultyEnum.enumValues).default("easy"),
  resourceUrl: z.string().url().optional().or(z.literal("")),
})

export const updateTechniqueSchema = createTechniqueSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const createAssignmentSchema = z.object({
  techniqueId: z.string().uuid(),
  clientId: z.string().uuid(),
  frequencyPerDay: z.number().int().min(1).max(TECHNIQUE_DAILY_FREQUENCY_MAX).default(TECHNIQUE_DEFAULT_FREQUENCY),
  // safetyCapMultiplier stored ×100: 150 = 1.5× daily target
  safetyCapMultiplier: z.number().int().min(100).max(300).default(TECHNIQUE_DEFAULT_SAFETY_CAP),
  maxDebtDays: z.number().int().min(1).max(30).default(TECHNIQUE_DEFAULT_MAX_DEBT_DAYS),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(FIELD_MAX_NOTES).optional(),
})

export const logTechniqueSchema = z.object({
  assignmentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedReps: z.number().int().min(1).max(20),
  notes: z.string().max(300).optional(),
  isRestDay: z.boolean().default(false),
})

export type CreateTechniqueInput = z.infer<typeof createTechniqueSchema>
export type UpdateTechniqueInput = z.infer<typeof updateTechniqueSchema>
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type LogTechniqueInput = z.infer<typeof logTechniqueSchema>

// ─── Debt / catch-up calculation ─────────────────────────────────────────────

export type LogByDate = Record<string, number> // date → completed reps that day

export interface TechniqueDebtResult {
  /** Total reps missed over the debt window (before safety cap) */
  rawDebt: number
  /** Max additional reps allowed today (daily target × safety cap) */
  safetyCapReps: number
  /** Catch-up reps to show the user: min(rawDebt, safetyCapReps - todayCompleted) */
  catchUpReps: number
  /** Reps already completed today */
  todayCompleted: number
  /** Normal daily target */
  dailyTarget: number
}

/**
 * Compute catch-up reps for a single assignment.
 *
 * Why safety cap? Long COVID / burnout clients must never over-exert.
 * Raw debt could be large after a bad week; we cap daily completion at
 * frequencyPerDay × (safetyCapMultiplier / 100) to protect against PEM.
 *
 * Debt older than maxDebtDays is forgiven — starting fresh is safer than
 * accumulating impossible catch-up loads.
 */
export function computeTechniqueDebt(
  assignment: {
    frequencyPerDay: number
    safetyCapMultiplier: number // ×100
    maxDebtDays: number
    startDate: string
    endDate?: string | null
    isActive: boolean
  },
  logs: LogByDate,
  today: string // ISO YYYY-MM-DD
): TechniqueDebtResult {
  const dailyTarget = assignment.frequencyPerDay
  const safetyCapReps = Math.floor(dailyTarget * (assignment.safetyCapMultiplier / 100))

  // Build the window: last maxDebtDays days ending yesterday (not today)
  const todayCompleted = logs[today] ?? 0
  let rawDebt = 0

  for (let i = 1; i <= assignment.maxDebtDays; i++) {
    const d = offsetDate(today, -i)
    // Only count days after the assignment start
    if (d < assignment.startDate) break
    if (assignment.endDate && d > assignment.endDate) continue
    const done = logs[d] ?? 0
    rawDebt += Math.max(0, dailyTarget - done)
  }

  const catchUpReps = Math.max(0, Math.min(rawDebt, safetyCapReps - todayCompleted))

  return { rawDebt, safetyCapReps, catchUpReps, todayCompleted, dailyTarget }
}

/** Offset an ISO date string by N days */
function offsetDate(isoDate: string, days: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}
