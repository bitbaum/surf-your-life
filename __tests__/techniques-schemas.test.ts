/**
 * Schema validation tests for technique domain schemas:
 * createTechniqueSchema, updateTechniqueSchema, createAssignmentSchema, logTechniqueSchema.
 *
 * techniques.ts imports from lib/db/schema (no DB client) and lib/utils,
 * so no vi.mock needed.
 */
import { describe, it, expect } from "vitest"
import {
  createTechniqueSchema,
  updateTechniqueSchema,
  createAssignmentSchema,
  logTechniqueSchema,
} from "@/lib/domain/techniques"

// ─── createTechniqueSchema ────────────────────────────────────────────────────

describe("createTechniqueSchema", () => {
  const valid = {
    name: "Box Breathing",
    description: "4-4-4-4 breath pattern for stress relief.",
    category: "breathwork" as const,
    instructions: "Inhale 4s, hold 4s, exhale 4s, hold 4s.",
    durationMinutes: 5,
    difficulty: "easy" as const,
    resourceUrl: "",
  }

  it("accepts a fully valid technique", () => {
    expect(createTechniqueSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts technique with only required fields", () => {
    expect(createTechniqueSchema.safeParse({ name: "Box Breathing", category: "breathwork" }).success).toBe(true)
  })

  it("defaults difficulty to 'easy' when omitted", () => {
    const result = createTechniqueSchema.safeParse({ name: "Test", category: "movement" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.difficulty).toBe("easy")
  })

  it("rejects empty name", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("rejects name exceeding 120 characters", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, name: "x".repeat(121) }).success).toBe(false)
  })

  it("accepts name exactly 120 characters", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, name: "x".repeat(120) }).success).toBe(true)
  })

  it("rejects description exceeding 500 characters", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, description: "x".repeat(501) }).success).toBe(false)
  })

  it("rejects instructions exceeding 2000 characters", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, instructions: "x".repeat(2001) }).success).toBe(false)
  })

  it("rejects durationMinutes below 1", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, durationMinutes: 0 }).success).toBe(false)
  })

  it("rejects durationMinutes above 120", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, durationMinutes: 121 }).success).toBe(false)
  })

  it("rejects non-integer durationMinutes", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, durationMinutes: 5.5 }).success).toBe(false)
  })

  it("accepts all valid category values", () => {
    for (const cat of ["breathwork", "movement", "mindfulness", "cognitive", "pacing", "sleep", "social"] as const) {
      expect(createTechniqueSchema.safeParse({ ...valid, category: cat }).success).toBe(true)
    }
  })

  it("rejects invalid category", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, category: "yoga" }).success).toBe(false)
  })

  it("accepts all valid difficulty values", () => {
    for (const d of ["easy", "moderate", "challenging"] as const) {
      expect(createTechniqueSchema.safeParse({ ...valid, difficulty: d }).success).toBe(true)
    }
  })

  it("rejects invalid difficulty", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, difficulty: "hard" }).success).toBe(false)
  })

  it("accepts empty string for resourceUrl (no URL required)", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, resourceUrl: "" }).success).toBe(true)
  })

  it("accepts valid URL for resourceUrl", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, resourceUrl: "https://example.com/guide" }).success).toBe(true)
  })

  it("rejects non-empty non-URL string for resourceUrl", () => {
    expect(createTechniqueSchema.safeParse({ ...valid, resourceUrl: "not-a-url" }).success).toBe(false)
  })
})

// ─── updateTechniqueSchema ────────────────────────────────────────────────────

describe("updateTechniqueSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    expect(updateTechniqueSchema.safeParse({}).success).toBe(true)
  })

  it("accepts partial update with only name", () => {
    expect(updateTechniqueSchema.safeParse({ name: "Updated Name" }).success).toBe(true)
  })

  it("accepts isActive toggle", () => {
    expect(updateTechniqueSchema.safeParse({ isActive: false }).success).toBe(true)
  })

  it("rejects invalid category in update", () => {
    expect(updateTechniqueSchema.safeParse({ category: "unknown" }).success).toBe(false)
  })

  it("rejects empty name in update", () => {
    expect(updateTechniqueSchema.safeParse({ name: "" }).success).toBe(false)
  })
})

// ─── createAssignmentSchema ───────────────────────────────────────────────────

describe("createAssignmentSchema", () => {
  const valid = {
    techniqueId: "550e8400-e29b-41d4-a716-446655440000",
    clientId:    "550e8400-e29b-41d4-a716-446655440001",
    frequencyPerDay: 2,
    safetyCapMultiplier: 150,
    maxDebtDays: 7,
    startDate: "2024-09-01",
  }

  it("accepts a fully valid assignment", () => {
    expect(createAssignmentSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts assignment without optional endDate and notes", () => {
    expect(createAssignmentSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts optional endDate", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, endDate: "2024-12-31" }).success).toBe(true)
  })

  it("rejects non-UUID techniqueId", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, techniqueId: "not-uuid" }).success).toBe(false)
  })

  it("rejects non-UUID clientId", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, clientId: "not-uuid" }).success).toBe(false)
  })

  it("rejects frequencyPerDay below 1", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, frequencyPerDay: 0 }).success).toBe(false)
  })

  it("rejects frequencyPerDay above 10", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, frequencyPerDay: 11 }).success).toBe(false)
  })

  it("rejects non-integer frequencyPerDay", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, frequencyPerDay: 1.5 }).success).toBe(false)
  })

  it("rejects safetyCapMultiplier below 100 (below 1× daily target)", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, safetyCapMultiplier: 99 }).success).toBe(false)
  })

  it("rejects safetyCapMultiplier above 300 (above 3× daily target)", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, safetyCapMultiplier: 301 }).success).toBe(false)
  })

  it("rejects maxDebtDays below 1", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, maxDebtDays: 0 }).success).toBe(false)
  })

  it("rejects maxDebtDays above 30", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, maxDebtDays: 31 }).success).toBe(false)
  })

  it("rejects malformed startDate", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, startDate: "01/09/2024" }).success).toBe(false)
    expect(createAssignmentSchema.safeParse({ ...valid, startDate: "2024-9-1" }).success).toBe(false)
  })

  it("rejects malformed endDate", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, endDate: "2024/12/31" }).success).toBe(false)
  })

  it("rejects notes exceeding 500 characters", () => {
    expect(createAssignmentSchema.safeParse({ ...valid, notes: "x".repeat(501) }).success).toBe(false)
  })
})

// ─── logTechniqueSchema ───────────────────────────────────────────────────────

describe("logTechniqueSchema", () => {
  const valid = {
    assignmentId: "550e8400-e29b-41d4-a716-446655440000",
    date: "2024-09-15",
    completedReps: 3,
    isRestDay: false,
  }

  it("accepts a valid log entry", () => {
    expect(logTechniqueSchema.safeParse(valid).success).toBe(true)
  })

  it("defaults isRestDay to false when omitted", () => {
    const { isRestDay: _, ...noFlag } = valid
    const result = logTechniqueSchema.safeParse(noFlag)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isRestDay).toBe(false)
  })

  it("rejects non-UUID assignmentId", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, assignmentId: "not-uuid" }).success).toBe(false)
  })

  it("rejects malformed date", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, date: "15-09-2024" }).success).toBe(false)
    expect(logTechniqueSchema.safeParse({ ...valid, date: "2024/09/15" }).success).toBe(false)
  })

  it("rejects completedReps below 1", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, completedReps: 0 }).success).toBe(false)
  })

  it("rejects completedReps above 20", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, completedReps: 21 }).success).toBe(false)
  })

  it("rejects non-integer completedReps", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, completedReps: 2.5 }).success).toBe(false)
  })

  it("accepts isRestDay true", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, isRestDay: true }).success).toBe(true)
  })

  it("rejects notes exceeding 300 characters", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, notes: "x".repeat(301) }).success).toBe(false)
  })

  it("accepts notes exactly 300 characters", () => {
    expect(logTechniqueSchema.safeParse({ ...valid, notes: "x".repeat(300) }).success).toBe(true)
  })

  it("rejects missing required fields", () => {
    expect(logTechniqueSchema.safeParse({}).success).toBe(false)
    expect(logTechniqueSchema.safeParse({ assignmentId: valid.assignmentId }).success).toBe(false)
  })
})
