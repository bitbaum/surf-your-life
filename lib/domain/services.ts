import { z } from "zod"
import { serviceCategoryEnum } from "@/lib/db/schema"
import { FIELD_MAX_SHORT, FIELD_MAX_NOTES, SERVICE_DURATION_MINUTES } from "@/lib/constants"

export const SERVICE_CATEGORIES = serviceCategoryEnum.enumValues

export const serviceSchema = z.object({
  name: z.string().min(1).max(FIELD_MAX_SHORT),
  description: z.string().max(FIELD_MAX_NOTES).nullish(),
  category: z.enum(SERVICE_CATEGORIES),
  durationMinutes: z.number().int().min(SERVICE_DURATION_MINUTES.min).max(SERVICE_DURATION_MINUTES.max).optional().nullable(),
})

export const serviceUpdateSchema = serviceSchema.partial().extend({
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type ServiceInput = z.infer<typeof serviceSchema>
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>
