import { z } from "zod"
import { mainConcernEnum, programStatusEnum } from "@/lib/db/schema"

export const createProgramSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  durationWeeks: z.number().int().min(1).max(104).optional().nullable(),
  targetConcern: z.enum(mainConcernEnum.enumValues).optional().nullable(),
})

export const enrollClientSchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string().optional().nullable(), // ISO date string
  notes: z.string().max(2000).optional(),
})

export const updateEnrollmentSchema = z.object({
  status: z.enum(programStatusEnum.enumValues),
  notes: z.string().max(2000).optional(),
})

export type CreateProgramInput = z.infer<typeof createProgramSchema>
export type EnrollClientInput = z.infer<typeof enrollClientSchema>
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>
