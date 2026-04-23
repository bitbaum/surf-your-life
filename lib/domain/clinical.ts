import { z } from "zod"
import { CAPACITY_SCALE, FIELD_MAX_LONG, FIELD_MAX_TITLE, FIELD_MAX_SHORT, FIELD_MAX_NOTES } from "@/lib/constants"

export const functionalAssessmentSchema = z.object({
  overallCapacity: z.number().int().min(CAPACITY_SCALE.min).max(CAPACITY_SCALE.max),
  cognitiveCapacity: z.number().int().min(CAPACITY_SCALE.min).max(CAPACITY_SCALE.max).nullable().optional(),
  physicalCapacity: z.number().int().min(CAPACITY_SCALE.min).max(CAPACITY_SCALE.max).nullable().optional(),
  emotionalCapacity: z.number().int().min(CAPACITY_SCALE.min).max(CAPACITY_SCALE.max).nullable().optional(),
  socialCapacity: z.number().int().min(CAPACITY_SCALE.min).max(CAPACITY_SCALE.max).nullable().optional(),
  notes: z.string().max(FIELD_MAX_LONG).optional(),
  assessedAt: z.string().datetime().optional(), // ISO string, defaults to now
})

export const medicationEntrySchema = z.object({
  medicationName: z.string().min(1).max(FIELD_MAX_TITLE),
  dose: z.string().max(FIELD_MAX_SHORT).optional(),
  frequency: z.string().max(FIELD_MAX_SHORT).optional(),
  startDate: z.string().optional(), // YYYY-MM-DD
  endDate: z.string().nullable().optional(), // YYYY-MM-DD or null = ongoing
  notes: z.string().max(FIELD_MAX_NOTES).optional(),
})

export type FunctionalAssessmentInput = z.infer<typeof functionalAssessmentSchema>
export type MedicationEntryInput = z.infer<typeof medicationEntrySchema>
