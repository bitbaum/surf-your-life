import { describe, it, expect } from "vitest"
import { functionalAssessmentSchema, medicationEntrySchema } from "@/lib/domain/clinical"
import { CAPACITY_SCALE } from "@/lib/constants"

// ─── functionalAssessmentSchema ───────────────────────────────────────────────

describe("functionalAssessmentSchema", () => {
  const validBase = { overallCapacity: 5 }

  it("accepts minimum valid input (overallCapacity only)", () => {
    expect(functionalAssessmentSchema.safeParse(validBase).success).toBe(true)
  })

  it("accepts full valid input", () => {
    const result = functionalAssessmentSchema.safeParse({
      overallCapacity: 7,
      cognitiveCapacity: 6,
      physicalCapacity: 5,
      emotionalCapacity: 4,
      socialCapacity: 8,
      notes: "Feeling better",
      assessedAt: new Date().toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it(`rejects overallCapacity below min (${CAPACITY_SCALE.min})`, () => {
    const result = functionalAssessmentSchema.safeParse({ overallCapacity: CAPACITY_SCALE.min - 1 })
    expect(result.success).toBe(false)
  })

  it(`rejects overallCapacity above max (${CAPACITY_SCALE.max})`, () => {
    const result = functionalAssessmentSchema.safeParse({ overallCapacity: CAPACITY_SCALE.max + 1 })
    expect(result.success).toBe(false)
  })

  it(`accepts boundary values (${CAPACITY_SCALE.min} and ${CAPACITY_SCALE.max})`, () => {
    expect(functionalAssessmentSchema.safeParse({ overallCapacity: CAPACITY_SCALE.min }).success).toBe(true)
    expect(functionalAssessmentSchema.safeParse({ overallCapacity: CAPACITY_SCALE.max }).success).toBe(true)
  })

  it("rejects non-integer overallCapacity", () => {
    const result = functionalAssessmentSchema.safeParse({ overallCapacity: 5.5 })
    expect(result.success).toBe(false)
  })

  it("accepts null for optional capacity fields", () => {
    const result = functionalAssessmentSchema.safeParse({
      overallCapacity: 5,
      cognitiveCapacity: null,
      physicalCapacity: null,
    })
    expect(result.success).toBe(true)
  })

  it("rejects optional capacity fields outside scale bounds", () => {
    expect(
      functionalAssessmentSchema.safeParse({ overallCapacity: 5, cognitiveCapacity: 0 }).success
    ).toBe(false)
    expect(
      functionalAssessmentSchema.safeParse({ overallCapacity: 5, physicalCapacity: 11 }).success
    ).toBe(false)
  })

  it("rejects missing overallCapacity", () => {
    const result = functionalAssessmentSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("rejects notes exceeding max length", () => {
    const result = functionalAssessmentSchema.safeParse({
      overallCapacity: 5,
      notes: "x".repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

// ─── medicationEntrySchema ────────────────────────────────────────────────────

describe("medicationEntrySchema", () => {
  const validBase = { medicationName: "Metoprolol" }

  it("accepts minimum valid input (name only)", () => {
    expect(medicationEntrySchema.safeParse(validBase).success).toBe(true)
  })

  it("accepts full valid input", () => {
    const result = medicationEntrySchema.safeParse({
      medicationName: "Metoprolol",
      dose: "25mg",
      frequency: "once daily",
      startDate: "2024-01-15",
      endDate: null,
      notes: "Take with food",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty medicationName", () => {
    const result = medicationEntrySchema.safeParse({ medicationName: "" })
    expect(result.success).toBe(false)
  })

  it("rejects medicationName exceeding 200 characters", () => {
    const result = medicationEntrySchema.safeParse({ medicationName: "x".repeat(201) })
    expect(result.success).toBe(false)
  })

  it("accepts medicationName at exactly 200 characters", () => {
    const result = medicationEntrySchema.safeParse({ medicationName: "x".repeat(200) })
    expect(result.success).toBe(true)
  })

  it("rejects dose exceeding 100 characters", () => {
    const result = medicationEntrySchema.safeParse({
      medicationName: "Metoprolol",
      dose: "x".repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it("accepts null for endDate (ongoing medication)", () => {
    const result = medicationEntrySchema.safeParse({
      medicationName: "Metoprolol",
      endDate: null,
    })
    expect(result.success).toBe(true)
  })

  it("rejects notes exceeding 500 characters", () => {
    const result = medicationEntrySchema.safeParse({
      medicationName: "Metoprolol",
      notes: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing medicationName", () => {
    const result = medicationEntrySchema.safeParse({ dose: "25mg" })
    expect(result.success).toBe(false)
  })
})
