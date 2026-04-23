/**
 * Schema validation tests for lib/domain/program:
 * phaseSchema, createProgramSchema, enrollClientSchema, updateEnrollmentSchema.
 *
 * program.ts only imports from lib/db/schema (schema definitions, no DB client),
 * so no vi.mock needed.
 */
import { describe, it, expect } from "vitest"
import {
  phaseSchema,
  createProgramSchema,
  enrollClientSchema,
  updateEnrollmentSchema,
} from "@/lib/domain/program"

// ─── phaseSchema ──────────────────────────────────────────────────────────────

describe("phaseSchema", () => {
  const valid = {
    week: 1,
    title: "Foundation Week",
    guidance: "Start with gentle movement.",
  }

  it("accepts a fully valid phase", () => {
    expect(phaseSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts phase without optional guidance", () => {
    expect(phaseSchema.safeParse({ week: 1, title: "Intro", guidance: "" }).success).toBe(true)
  })

  it("rejects week below 1", () => {
    expect(phaseSchema.safeParse({ ...valid, week: 0 }).success).toBe(false)
  })

  it("rejects week above 104", () => {
    expect(phaseSchema.safeParse({ ...valid, week: 105 }).success).toBe(false)
  })

  it("accepts boundary weeks (1 and 104)", () => {
    expect(phaseSchema.safeParse({ ...valid, week: 1 }).success).toBe(true)
    expect(phaseSchema.safeParse({ ...valid, week: 104 }).success).toBe(true)
  })

  it("rejects non-integer week", () => {
    expect(phaseSchema.safeParse({ ...valid, week: 1.5 }).success).toBe(false)
  })

  it("rejects empty title", () => {
    expect(phaseSchema.safeParse({ ...valid, title: "" }).success).toBe(false)
  })

  it("rejects title exceeding 200 characters", () => {
    expect(phaseSchema.safeParse({ ...valid, title: "x".repeat(201) }).success).toBe(false)
  })

  it("accepts title exactly 200 characters", () => {
    expect(phaseSchema.safeParse({ ...valid, title: "x".repeat(200) }).success).toBe(true)
  })

  it("rejects guidance exceeding 2000 characters", () => {
    expect(phaseSchema.safeParse({ ...valid, guidance: "x".repeat(2001) }).success).toBe(false)
  })

  it("accepts guidance exactly 2000 characters", () => {
    expect(phaseSchema.safeParse({ ...valid, guidance: "x".repeat(2000) }).success).toBe(true)
  })
})

// ─── createProgramSchema ──────────────────────────────────────────────────────

describe("createProgramSchema", () => {
  const valid = {
    title: "Burnout Recovery 8-Week",
    description: "Evidence-based programme for burnout recovery.",
    durationWeeks: 8,
    targetConcern: "burnout" as const,
    isTemplate: false,
  }

  it("accepts a fully valid program", () => {
    expect(createProgramSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts program with only required title", () => {
    expect(createProgramSchema.safeParse({ title: "Minimal Program" }).success).toBe(true)
  })

  it("rejects empty title", () => {
    expect(createProgramSchema.safeParse({ ...valid, title: "" }).success).toBe(false)
  })

  it("rejects title exceeding 200 characters", () => {
    expect(createProgramSchema.safeParse({ ...valid, title: "x".repeat(201) }).success).toBe(false)
  })

  it("rejects description exceeding 2000 characters", () => {
    expect(createProgramSchema.safeParse({ ...valid, description: "x".repeat(2001) }).success).toBe(false)
  })

  it("accepts description exactly 2000 characters", () => {
    expect(createProgramSchema.safeParse({ ...valid, description: "x".repeat(2000) }).success).toBe(true)
  })

  it("rejects durationWeeks below 1", () => {
    expect(createProgramSchema.safeParse({ ...valid, durationWeeks: 0 }).success).toBe(false)
  })

  it("rejects durationWeeks above 104", () => {
    expect(createProgramSchema.safeParse({ ...valid, durationWeeks: 105 }).success).toBe(false)
  })

  it("accepts durationWeeks boundary values (1 and 104)", () => {
    expect(createProgramSchema.safeParse({ ...valid, durationWeeks: 1 }).success).toBe(true)
    expect(createProgramSchema.safeParse({ ...valid, durationWeeks: 104 }).success).toBe(true)
  })

  it("rejects non-integer durationWeeks", () => {
    expect(createProgramSchema.safeParse({ ...valid, durationWeeks: 8.5 }).success).toBe(false)
  })

  it("accepts null durationWeeks", () => {
    expect(createProgramSchema.safeParse({ ...valid, durationWeeks: null }).success).toBe(true)
  })

  it("accepts all valid targetConcern values", () => {
    for (const concern of ["burnout", "long_covid", "midlife_reinvention", "general_wellbeing", "other"] as const) {
      expect(createProgramSchema.safeParse({ ...valid, targetConcern: concern }).success).toBe(true)
    }
  })

  it("rejects invalid targetConcern", () => {
    expect(createProgramSchema.safeParse({ ...valid, targetConcern: "stress" }).success).toBe(false)
  })

  it("accepts null targetConcern", () => {
    expect(createProgramSchema.safeParse({ ...valid, targetConcern: null }).success).toBe(true)
  })

  it("accepts valid phaseConfig array", () => {
    const phases = [
      { week: 1, title: "Week 1", guidance: "Begin gently." },
      { week: 2, title: "Week 2", guidance: "Build slowly." },
    ]
    expect(createProgramSchema.safeParse({ ...valid, phaseConfig: phases }).success).toBe(true)
  })

  it("rejects phaseConfig with invalid phase (week out of range)", () => {
    const phases = [{ week: 0, title: "Invalid", guidance: "" }]
    expect(createProgramSchema.safeParse({ ...valid, phaseConfig: phases }).success).toBe(false)
  })

  it("accepts null phaseConfig", () => {
    expect(createProgramSchema.safeParse({ ...valid, phaseConfig: null }).success).toBe(true)
  })
})

// ─── enrollClientSchema ───────────────────────────────────────────────────────

describe("enrollClientSchema", () => {
  const valid = {
    clientId: "550e8400-e29b-41d4-a716-446655440000",
    startDate: "2024-09-01",
    notes: "Client is motivated and ready.",
  }

  it("accepts a fully valid enrollment", () => {
    expect(enrollClientSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts enrollment without optional startDate", () => {
    const { startDate: _, ...noDate } = valid
    expect(enrollClientSchema.safeParse(noDate).success).toBe(true)
  })

  it("accepts enrollment without optional notes", () => {
    const { notes: _, ...noNotes } = valid
    expect(enrollClientSchema.safeParse(noNotes).success).toBe(true)
  })

  it("accepts null startDate", () => {
    expect(enrollClientSchema.safeParse({ ...valid, startDate: null }).success).toBe(true)
  })

  it("rejects non-UUID clientId", () => {
    expect(enrollClientSchema.safeParse({ ...valid, clientId: "not-a-uuid" }).success).toBe(false)
  })

  it("rejects missing clientId", () => {
    const { clientId: _, ...noClient } = valid
    expect(enrollClientSchema.safeParse(noClient).success).toBe(false)
  })

  it("rejects notes exceeding 2000 characters", () => {
    expect(enrollClientSchema.safeParse({ ...valid, notes: "x".repeat(2001) }).success).toBe(false)
  })

  it("accepts notes exactly 2000 characters", () => {
    expect(enrollClientSchema.safeParse({ ...valid, notes: "x".repeat(2000) }).success).toBe(true)
  })
})

// ─── updateEnrollmentSchema ───────────────────────────────────────────────────

describe("updateEnrollmentSchema", () => {
  it("accepts all valid status values", () => {
    for (const status of ["active", "completed", "paused"] as const) {
      expect(updateEnrollmentSchema.safeParse({ status }).success).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    expect(updateEnrollmentSchema.safeParse({ status: "cancelled" }).success).toBe(false)
  })

  it("rejects missing status", () => {
    expect(updateEnrollmentSchema.safeParse({}).success).toBe(false)
  })

  it("accepts optional notes with status", () => {
    expect(updateEnrollmentSchema.safeParse({ status: "completed", notes: "Great progress." }).success).toBe(true)
  })

  it("rejects notes exceeding 2000 characters", () => {
    expect(updateEnrollmentSchema.safeParse({ status: "active", notes: "x".repeat(2001) }).success).toBe(false)
  })

  it("accepts notes exactly 2000 characters", () => {
    expect(updateEnrollmentSchema.safeParse({ status: "active", notes: "x".repeat(2000) }).success).toBe(true)
  })
})
