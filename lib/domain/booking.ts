import { z } from "zod"

export const PREFERRED_TIMES = ["morning", "afternoon", "flexible"] as const
export type PreferredTime = typeof PREFERRED_TIMES[number]

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  preferredTime: z.enum(PREFERRED_TIMES),
  notes: z.string().max(1000).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
