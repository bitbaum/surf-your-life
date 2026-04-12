import { z } from "zod"
import { ENERGY_SCALE, QUALITY_SCALE, SLEEP_HOURS } from "@/lib/constants"

export const profileSchema = z.object({
  name: z.string().max(200).optional(),
  gender: z.string().max(50).optional(),
  occupation: z.string().max(200).optional(),
  dateOfBirth: z.string().optional(),
  workHoursPerWeek: z.number().int().min(0).max(168).optional().nullable(),
  insuranceProvider: z.string().max(200).optional(),
  mainConcern: z.string().max(500).optional(), // stores comma-separated values for multi-select
  currentSituation: z.string().max(5000).optional(),
  goals: z.string().max(5000).optional(),
  existingDiagnoses: z.string().max(2000).optional(),
  familyHistory: z.string().max(2000).optional(),
  previousTherapy: z.boolean().optional(),
  medications: z.string().max(1000).optional(),
  heightCm: z.number().int().min(50).max(300).optional().nullable(),
  weightKg: z.number().int().min(20).max(500).optional().nullable(),
  sleepQuality: z.number().int().min(QUALITY_SCALE.min).max(QUALITY_SCALE.max).optional(),
  sleepSchedule: z.string().max(100).optional(),
  exerciseFrequency: z.string().max(200).optional(),
  alcoholTobacco: z.string().max(500).optional(),
  socialSupport: z.number().int().min(1).max(10).optional().nullable(),
  stressLevel: z.number().int().min(QUALITY_SCALE.min).max(QUALITY_SCALE.max).optional(),
})

export const checkInSchema = z.object({
  mood: z.enum(["very_low", "low", "neutral", "good", "excellent"]),
  energyLevel: z.number().int().min(ENERGY_SCALE.min).max(ENERGY_SCALE.max),
  sleepHours: z.number().int().min(SLEEP_HOURS.min).max(SLEEP_HOURS.max).nullable().optional(),
  notes: z.string().max(2000).optional(),
  wins: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type CheckInInput = z.infer<typeof checkInSchema>
