import { z } from "zod"
import {
  ENERGY_SCALE, QUALITY_SCALE, SLEEP_HOURS, SLEEP_QUALITY_SCALE, PRACTITIONER_NOTE_MAX_LENGTH,
  SYMPTOM_SCALE, PEM_SEVERITY_SCALE,
  FIELD_MAX_TITLE, FIELD_MAX_SHORT, FIELD_MAX_NOTES, FIELD_MAX_MEDIUM, FIELD_MAX_LONG,
  FIELD_MAX_MESSAGE, FIELD_MAX_JOURNAL,
  HEIGHT_CM, WEIGHT_KG, WORK_HOURS_WEEK_MAX,
} from "@/lib/constants"
import { mainConcernEnum, activityLevelEnum } from "@/lib/db/schema"

export const profileSchema = z.object({
  name: z.string().max(FIELD_MAX_TITLE).optional(),
  gender: z.string().max(50).optional(),
  occupation: z.string().max(FIELD_MAX_TITLE).optional(),
  dateOfBirth: z.string().optional(),
  workHoursPerWeek: z.number().int().min(0).max(WORK_HOURS_WEEK_MAX).optional().nullable(),
  insuranceProvider: z.string().max(FIELD_MAX_TITLE).optional(),
  mainConcern: z.enum(mainConcernEnum.enumValues).optional().nullable(),
  currentSituation: z.string().max(FIELD_MAX_MESSAGE).optional(),
  goals: z.string().max(FIELD_MAX_MESSAGE).optional(),
  existingDiagnoses: z.string().max(FIELD_MAX_LONG).optional(),
  familyHistory: z.string().max(FIELD_MAX_LONG).optional(),
  previousTherapy: z.boolean().optional(),
  medications: z.string().max(FIELD_MAX_MEDIUM).optional(),
  heightCm: z.number().int().min(HEIGHT_CM.min).max(HEIGHT_CM.max).optional().nullable(),
  weightKg: z.number().int().min(WEIGHT_KG.min).max(WEIGHT_KG.max).optional().nullable(),
  sleepQuality: z.number().int().min(QUALITY_SCALE.min).max(QUALITY_SCALE.max).optional(),
  sleepSchedule: z.string().max(FIELD_MAX_SHORT).optional(),
  exerciseFrequency: z.string().max(FIELD_MAX_TITLE).optional(),
  alcoholTobacco: z.string().max(FIELD_MAX_NOTES).optional(),
  socialSupport: z.number().int().min(1).max(10).optional().nullable(),
  stressLevel: z.number().int().min(QUALITY_SCALE.min).max(QUALITY_SCALE.max).optional(),
})

export const checkInSchema = z.object({
  mood: z.enum(["very_low", "low", "neutral", "good", "excellent"]),
  energyLevel: z.number().int().min(ENERGY_SCALE.min).max(ENERGY_SCALE.max),
  sleepHours: z.number().int().min(SLEEP_HOURS.min).max(SLEEP_HOURS.max).nullable().optional(),
  notes: z.string().max(FIELD_MAX_LONG).nullish(),
  wins: z.string().max(FIELD_MAX_MEDIUM).nullish(),
  challenges: z.string().max(FIELD_MAX_MEDIUM).nullish(),
  symptomFatigue: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  symptomBrainFog: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  symptomPain: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  stressLevel: z.number().int().min(SYMPTOM_SCALE.min).max(SYMPTOM_SCALE.max).nullable().optional(),
  activityLevel: z.enum(activityLevelEnum.enumValues).nullable().optional(),
  pemFlag: z.boolean().optional(),
  pemSeverity: z.number().int().min(PEM_SEVERITY_SCALE.min).max(PEM_SEVERITY_SCALE.max).nullable().optional(),
  sleepQuality: z.number().int().min(SLEEP_QUALITY_SCALE.min).max(SLEEP_QUALITY_SCALE.max).nullable().optional(),
  orthostaticSymptoms: z.boolean().nullable().optional(),
  journalEntry: z.string().max(FIELD_MAX_JOURNAL).nullish(),
})

export const practitionerNoteSchema = z.object({
  note: z.string().min(1).max(PRACTITIONER_NOTE_MAX_LENGTH),
})

export type ProfileInput = z.infer<typeof profileSchema>
export type CheckInInput = z.infer<typeof checkInSchema>
export type PractitionerNoteInput = z.infer<typeof practitionerNoteSchema>
