import { z } from "zod"
import { serviceCategoryEnum } from "@/lib/db/schema"

export const SERVICE_CATEGORIES = serviceCategoryEnum.enumValues

export const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullish(),
  category: z.enum(SERVICE_CATEGORIES),
  durationMinutes: z.number().int().min(5).max(480).optional().nullable(),
})

export const serviceUpdateSchema = serviceSchema.partial().extend({
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export type ServiceInput = z.infer<typeof serviceSchema>
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>
