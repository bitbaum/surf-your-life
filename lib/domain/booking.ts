import { z } from "zod"
import { BOOKING_TIME_PREFERENCE_VALUES, FIELD_MAX_MEDIUM } from "@/lib/constants"

export type PreferredTime = typeof BOOKING_TIME_PREFERENCE_VALUES[number]

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  preferredTime: z.enum(BOOKING_TIME_PREFERENCE_VALUES),
  notes: z.string().max(FIELD_MAX_MEDIUM).optional(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
