import { z } from "zod"
import { ENERGY_SCALE, QUALITY_SCALE, SLEEP_HOURS, SLEEP_QUALITY_SCALE, PRACTITIONER_NOTE_MAX_LENGTH, SYMPTOM_SCALE, PEM_SEVERITY_SCALE } from "@/lib/constants"
import { mainConcernEnum, activityLevelEnum } from "@/lib/db/schema"

export const profileSchema = z.object({
  name: z.string().max(200).optional(),
  gender: z.string().max(50).optional(),
  occupation: z.string().max(200).optional(),
  dateOfBirth: z.string().optional(),
  workHoursPerWeek: z.number().int().min(0).max(168).optional().nullable(),
  insuranceProvider: z.string().max(200).optional(),
  mainConcern: z.enum(mainConcernEnum.enumValues).optional().nullable(),
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
  symptomFatigue: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  symptomBrainFog: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  symptomPain: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  stressLevel: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  activityLevel: z.enum(activityLevelEnum.enumValues).nullable().optional(),
  pemFlag: z.boolean().optional(),
  pemSeverity: z.number().int().min(PEM_SEVERITY_SCALE.min).max(PEM_SEVERITY_SCALE.max).nullable().optional(),
  sleepQuality: z.number().int().min(SLEEP_QUALITY_SCALE.min).max(SLEEP_QUALITY_SCALE.max).nullable().optional(),
  orthostaticSymptoms: z.boolean().nullable().optional(),
  journalEntry: z.string().max(3000).optional(),
})

export const practitionerNoteSchema = z.object({
  note: z.string().min(1).max(PRACTITIONER_NOTE_MAX_LENGTH),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type CheckInInput = z.infer<typeof checkInSchema>
export type PractitionerNoteInput = z.infer<typeof practitionerNoteSchema>
