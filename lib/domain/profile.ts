import { z } from "zod"
import { ENERGY_SCALE, QUALITY_SCALE, SLEEP_HOURS } from "@/lib/constants"

export const profileSchema = z.object({
  occupation: z.string().max(200).optional(),
  dateOfBirth: z.string().optional(),
  mainConcern: z.string().max(100).optional(),
  currentSituation: z.string().max(5000).optional(),
  goals: z.string().max(5000).optional(),
  previousTherapy: z.boolean().optional(),
  medications: z.string().max(1000).optional(),
  sleepQuality: z.number().int().min(QUALITY_SCALE.min).max(QUALITY_SCALE.max).optional(),
  stressLevel: z.number().int().min(QUALITY_SCALE.min).max(QUALITY_SCALE.max).optional(),
  exerciseFrequency: z.string().max(200).optional(),
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
