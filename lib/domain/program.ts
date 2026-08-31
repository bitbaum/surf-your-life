import { z } from "zod";
import { mainConcernEnum, programStatusEnum } from "@/lib/db/schema";
import { FIELD_MAX_TITLE, FIELD_MAX_LONG, PROGRAM_DURATION_WEEKS_MAX } from "@/lib/constants";

export const phaseSchema = z.object({
  week: z.number().int().min(1).max(PROGRAM_DURATION_WEEKS_MAX),
  title: z.string().min(1).max(FIELD_MAX_TITLE),
  guidance: z.string().max(FIELD_MAX_LONG),
});

export const createProgramSchema = z.object({
  title: z.string().min(1).max(FIELD_MAX_TITLE),
  description: z.string().max(FIELD_MAX_LONG).optional(),
  durationWeeks: z.number().int().min(1).max(PROGRAM_DURATION_WEEKS_MAX).optional().nullable(),
  targetConcern: z.enum(mainConcernEnum.enumValues).optional().nullable(),
  isTemplate: z.boolean().optional(),
  phaseConfig: z.array(phaseSchema).optional().nullable(),
});

export type ProgramPhase = z.infer<typeof phaseSchema>;

export const enrollClientSchema = z.object({
  clientId: z.string().uuid(),
  startDate: z.string().optional().nullable(), // ISO date string
  notes: z.string().max(FIELD_MAX_LONG).optional(),
});

export const updateEnrollmentSchema = z.object({
  status: z.enum(programStatusEnum.enumValues),
  notes: z.string().max(FIELD_MAX_LONG).optional(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type EnrollClientInput = z.infer<typeof enrollClientSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
