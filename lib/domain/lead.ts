import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  message: z.string().max(5000).optional(),
})

export const newsletterSchema = z.object({
  email: z.string().email().max(300),
  source: z.string().max(100).default("newsletter"),
})

export type ContactInput = z.infer<typeof contactSchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>
