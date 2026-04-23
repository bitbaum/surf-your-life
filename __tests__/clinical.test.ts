import { describe, it, expect } from "vitest"
import { functionalAssessmentSchema, medicationEntrySchema } from "@/lib/domain/clinical"
import { CAPACITY_SCALE, FIELD_MAX_LONG, FIELD_MAX_TITLE, FIELD_MAX_SHORT, FIELD_MAX_NOTES } from "@/lib/constants"

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
      functionalAssessmentSchema.safeParse({ overallCapacity: 5, cognitiveCapacity: CAPACITY_SCALE.min - 1 }).success
    ).toBe(false)
    expect(
      functionalAssessmentSchema.safeParse({ overallCapacity: 5, physicalCapacity: CAPACITY_SCALE.max + 1 }).success
    ).toBe(false)
  })

  it("rejects missing overallCapacity", () => {
    const result = functionalAssessmentSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it(`rejects notes exceeding ${FIELD_MAX_LONG} characters`, () => {
    const result = functionalAssessmentSchema.safeParse({
      overallCapacity: 5,
      notes: "x".repeat(FIELD_MAX_LONG + 1),
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

  it(`rejects medicationName exceeding ${FIELD_MAX_TITLE} characters`, () => {
    const result = medicationEntrySchema.safeParse({ medicationName: "x".repeat(FIELD_MAX_TITLE + 1) })
    expect(result.success).toBe(false)
  })

  it(`accepts medicationName at exactly ${FIELD_MAX_TITLE} characters`, () => {
    const result = medicationEntrySchema.safeParse({ medicationName: "x".repeat(FIELD_MAX_TITLE) })
    expect(result.success).toBe(true)
  })

  it(`rejects dose exceeding ${FIELD_MAX_SHORT} characters`, () => {
    const result = medicationEntrySchema.safeParse({
      medicationName: "Metoprolol",
      dose: "x".repeat(FIELD_MAX_SHORT + 1),
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

  it(`rejects notes exceeding ${FIELD_MAX_NOTES} characters`, () => {
    const result = medicationEntrySchema.safeParse({
      medicationName: "Metoprolol",
      notes: "x".repeat(FIELD_MAX_NOTES + 1),
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing medicationName", () => {
    const result = medicationEntrySchema.safeParse({ dose: "25mg" })
    expect(result.success).toBe(false)
  })
})
