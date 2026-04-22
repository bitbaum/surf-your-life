import { describe, it, expect } from "vitest"
import { profileSchema, checkInSchema, practitionerNoteSchema } from "@/lib/domain/profile"
import {
  ENERGY_SCALE,
  QUALITY_SCALE,
  SLEEP_HOURS,
  SLEEP_QUALITY_SCALE,
  SYMPTOM_SCALE,
  PEM_SEVERITY_SCALE,
  PRACTITIONER_NOTE_MAX_LENGTH,
} from "@/lib/constants"

// ─── profileSchema ────────────────────────────────────────────────────────────

describe("profileSchema", () => {
  it("accepts a fully empty object (all fields optional)", () => {
    const result = profileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts a valid complete profile", () => {
    const result = profileSchema.safeParse({
      name: "Jane Doe",
      gender: "female",
      occupation: "Software Engineer",
      dateOfBirth: "1990-01-01",
      workHoursPerWeek: 40,
      insuranceProvider: "Swica",
      mainConcern: "burnout",
      currentSituation: "I feel exhausted.",
      goals: "Regain energy.",
      existingDiagnoses: "none",
      familyHistory: "n/a",
      previousTherapy: true,
      medications: "none",
      heightCm: 170,
      weightKg: 70,
      sleepQuality: 7,
      sleepSchedule: "23:00–07:00",
      exerciseFrequency: "3x/week",
      alcoholTobacco: "none",
      socialSupport: 8,
      stressLevel: 6,
    })
    expect(result.success).toBe(true)
  })

  it("rejects name longer than 200 characters", () => {
    const result = profileSchema.safeParse({ name: "a".repeat(201) })
    expect(result.success).toBe(false)
  })

  it("rejects workHoursPerWeek > 168 (more than a full week)", () => {
    const result = profileSchema.safeParse({ workHoursPerWeek: 169 })
    expect(result.success).toBe(false)
  })

  it("accepts workHoursPerWeek = 0 (not working)", () => {
    const result = profileSchema.safeParse({ workHoursPerWeek: 0 })
    expect(result.success).toBe(true)
  })

  it("rejects unknown mainConcern value", () => {
    const result = profileSchema.safeParse({ mainConcern: "stress" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid mainConcern values", () => {
    const valid = ["burnout", "long_covid", "midlife_reinvention", "general_wellbeing", "other"]
    for (const concern of valid) {
      const result = profileSchema.safeParse({ mainConcern: concern })
      expect(result.success).toBe(true)
    }
  })

  it("rejects heightCm below 50", () => {
    const result = profileSchema.safeParse({ heightCm: 49 })
    expect(result.success).toBe(false)
  })

  it("rejects heightCm above 300", () => {
    const result = profileSchema.safeParse({ heightCm: 301 })
    expect(result.success).toBe(false)
  })

  it("rejects weightKg below 20", () => {
    const result = profileSchema.safeParse({ weightKg: 19 })
    expect(result.success).toBe(false)
  })

  it("rejects weightKg above 500", () => {
    const result = profileSchema.safeParse({ weightKg: 501 })
    expect(result.success).toBe(false)
  })

  it(`rejects sleepQuality outside [${QUALITY_SCALE.min}, ${QUALITY_SCALE.max}]`, () => {
    expect(profileSchema.safeParse({ sleepQuality: QUALITY_SCALE.min - 1 }).success).toBe(false)
    expect(profileSchema.safeParse({ sleepQuality: QUALITY_SCALE.max + 1 }).success).toBe(false)
  })

  it(`accepts sleepQuality at scale boundaries [${QUALITY_SCALE.min}, ${QUALITY_SCALE.max}]`, () => {
    expect(profileSchema.safeParse({ sleepQuality: QUALITY_SCALE.min }).success).toBe(true)
    expect(profileSchema.safeParse({ sleepQuality: QUALITY_SCALE.max }).success).toBe(true)
  })

  it(`rejects stressLevel outside [${QUALITY_SCALE.min}, ${QUALITY_SCALE.max}]`, () => {
    expect(profileSchema.safeParse({ stressLevel: QUALITY_SCALE.min - 1 }).success).toBe(false)
    expect(profileSchema.safeParse({ stressLevel: QUALITY_SCALE.max + 1 }).success).toBe(false)
  })

  it("accepts mainConcern: null (cleared field)", () => {
    const result = profileSchema.safeParse({ mainConcern: null })
    expect(result.success).toBe(true)
  })

  it("rejects goals longer than 5000 characters", () => {
    const result = profileSchema.safeParse({ goals: "a".repeat(5001) })
    expect(result.success).toBe(false)
  })
})

// ─── checkInSchema ────────────────────────────────────────────────────────────

describe("checkInSchema", () => {
  const VALID_BASE = {
    mood: "neutral" as const,
    energyLevel: 5,
  }

  it("accepts a minimal valid check-in (only required fields)", () => {
    const result = checkInSchema.safeParse(VALID_BASE)
    expect(result.success).toBe(true)
  })

  it("accepts a fully populated check-in", () => {
    const result = checkInSchema.safeParse({
      mood: "good",
      energyLevel: 7,
      sleepHours: 8,
      notes: "Felt better today.",
      wins: "Went for a walk.",
      challenges: "Afternoon fatigue.",
      symptomFatigue: 4,
      symptomBrainFog: 3,
      symptomPain: 2,
      stressLevel: 5,
      activityLevel: "light",
      pemFlag: false,
      pemSeverity: null,
      sleepQuality: 3,
      orthostaticSymptoms: false,
      journalEntry: "Today was an improvement overall.",
    })
    expect(result.success).toBe(true)
  })

  it("requires mood", () => {
    const result = checkInSchema.safeParse({ energyLevel: 5 })
    expect(result.success).toBe(false)
  })

  it("requires energyLevel", () => {
    const result = checkInSchema.safeParse({ mood: "neutral" })
    expect(result.success).toBe(false)
  })

  it("rejects unknown mood value", () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, mood: "amazing" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid mood values", () => {
    const moods = ["very_low", "low", "neutral", "good", "excellent"]
    for (const mood of moods) {
      const result = checkInSchema.safeParse({ ...VALID_BASE, mood })
      expect(result.success).toBe(true)
    }
  })

  it(`rejects energyLevel below ${ENERGY_SCALE.min}`, () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, energyLevel: ENERGY_SCALE.min - 1 })
    expect(result.success).toBe(false)
  })

  it(`rejects energyLevel above ${ENERGY_SCALE.max}`, () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, energyLevel: ENERGY_SCALE.max + 1 })
    expect(result.success).toBe(false)
  })

  it(`accepts energyLevel at boundaries [${ENERGY_SCALE.min}, ${ENERGY_SCALE.max}]`, () => {
    expect(checkInSchema.safeParse({ ...VALID_BASE, energyLevel: ENERGY_SCALE.min }).success).toBe(true)
    expect(checkInSchema.safeParse({ ...VALID_BASE, energyLevel: ENERGY_SCALE.max }).success).toBe(true)
  })

  it(`rejects sleepHours above ${SLEEP_HOURS.max}`, () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, sleepHours: SLEEP_HOURS.max + 1 })
    expect(result.success).toBe(false)
  })

  it("accepts sleepHours: null (not recorded)", () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, sleepHours: null })
    expect(result.success).toBe(true)
  })

  it(`rejects symptomFatigue outside [${SYMPTOM_SCALE.min}, ${SYMPTOM_SCALE.max}]`, () => {
    expect(checkInSchema.safeParse({ ...VALID_BASE, symptomFatigue: SYMPTOM_SCALE.min - 1 }).success).toBe(false)
    expect(checkInSchema.safeParse({ ...VALID_BASE, symptomFatigue: SYMPTOM_SCALE.max + 1 }).success).toBe(false)
  })

  it(`rejects pemSeverity outside [${PEM_SEVERITY_SCALE.min}, ${PEM_SEVERITY_SCALE.max}]`, () => {
    expect(checkInSchema.safeParse({ ...VALID_BASE, pemSeverity: PEM_SEVERITY_SCALE.min - 1 }).success).toBe(false)
    expect(checkInSchema.safeParse({ ...VALID_BASE, pemSeverity: PEM_SEVERITY_SCALE.max + 1 }).success).toBe(false)
  })

  it("rejects unknown activityLevel value", () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, activityLevel: "intense" })
    expect(result.success).toBe(false)
  })

  it("accepts all valid activityLevel values", () => {
    const levels = ["rest", "light", "moderate", "active"]
    for (const activityLevel of levels) {
      const result = checkInSchema.safeParse({ ...VALID_BASE, activityLevel })
      expect(result.success).toBe(true)
    }
  })

  it(`rejects sleepQuality outside [${SLEEP_QUALITY_SCALE.min}, ${SLEEP_QUALITY_SCALE.max}]`, () => {
    expect(checkInSchema.safeParse({ ...VALID_BASE, sleepQuality: SLEEP_QUALITY_SCALE.min - 1 }).success).toBe(false)
    expect(checkInSchema.safeParse({ ...VALID_BASE, sleepQuality: SLEEP_QUALITY_SCALE.max + 1 }).success).toBe(false)
  })

  it("rejects notes longer than 2000 characters", () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, notes: "a".repeat(2001) })
    expect(result.success).toBe(false)
  })

  it("rejects journalEntry longer than 3000 characters", () => {
    const result = checkInSchema.safeParse({ ...VALID_BASE, journalEntry: "a".repeat(3001) })
    expect(result.success).toBe(false)
  })
})

// ─── practitionerNoteSchema ───────────────────────────────────────────────────

describe("practitionerNoteSchema", () => {
  it("accepts a valid note", () => {
    const result = practitionerNoteSchema.safeParse({ note: "Client showed improvement this week." })
    expect(result.success).toBe(true)
  })

  it("rejects an empty note", () => {
    const result = practitionerNoteSchema.safeParse({ note: "" })
    expect(result.success).toBe(false)
  })

  it(`rejects note longer than ${PRACTITIONER_NOTE_MAX_LENGTH} characters`, () => {
    const result = practitionerNoteSchema.safeParse({ note: "a".repeat(PRACTITIONER_NOTE_MAX_LENGTH + 1) })
    expect(result.success).toBe(false)
  })

  it(`accepts note at the max length (${PRACTITIONER_NOTE_MAX_LENGTH} chars)`, () => {
    const result = practitionerNoteSchema.safeParse({ note: "a".repeat(PRACTITIONER_NOTE_MAX_LENGTH) })
    expect(result.success).toBe(true)
  })

  it("rejects missing note field", () => {
    const result = practitionerNoteSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
