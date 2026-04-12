import { z } from "zod"

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  preferredTime: z.enum(["morning", "afternoon", "flexible"]),
  notes: z.string().max(1000).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
