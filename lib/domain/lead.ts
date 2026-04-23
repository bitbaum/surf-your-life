import { z } from "zod"
import { FIELD_MAX_TITLE, FIELD_MAX_SHORT, FIELD_MAX_MESSAGE } from "@/lib/constants"

export const contactSchema = z.object({
  name: z.string().min(1).max(FIELD_MAX_TITLE),
  email: z.string().email().max(300),
  message: z.string().max(FIELD_MAX_MESSAGE).optional(),
})

export const newsletterSchema = z.object({
  email: z.string().email().max(300),
  source: z.string().max(FIELD_MAX_SHORT).default("newsletter"),
})

export type ContactInput = z.infer<typeof contactSchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>
