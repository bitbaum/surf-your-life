import { describe, it, expect, vi } from "vitest"

// alerts.ts imports lib/db at module level; mock it so the pure evaluateAlertRules
// function is testable without a real database connection string.
vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }))
vi.mock("@/lib/email/templates", () => ({ practitionerAlertEmail: vi.fn() }))

import { evaluateAlertRules, type CheckInDataForAlerts } from "@/lib/domain/alerts"
import {
  ALERT_ENERGY_DECLINE_THRESHOLD,
  ALERT_FATIGUE_SPIKE_THRESHOLD,
  ALERT_STRESS_SPIKE_THRESHOLD,
  ALERT_PEM_CLUSTER_COUNT,
  ALERT_ORTHOSTATIC_CLUSTER_COUNT,
  SEVEN_DAYS_MS,
  DAY_MS,
} from "@/lib/constants"
const NOW = new Date("2024-06-15T12:00:00Z")

function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * DAY_MS)
}

function makeCheckIn(overrides: Partial<CheckInDataForAlerts> = {}): CheckInDataForAlerts {
  return {
    energyLevel: 5,
    symptomFatigue: null,
    stressLevel: null,
    pemFlag: null,
    createdAt: daysAgo(0),
    mood: "neutral",
    orthostaticSymptoms: null,
    activityLevel: "light",
    ...overrides,
  }
}

// ─── Baseline ─────────────────────────────────────────────────────────────────

describe("evaluateAlertRules — baseline", () => {
  it("returns empty array for no check-ins", () => {
    expect(evaluateAlertRules([], NOW)).toEqual([])
  })

  it("returns empty array for healthy check-ins within normal ranges", () => {
    const recent = [
      makeCheckIn({ energyLevel: 7, mood: "good", createdAt: daysAgo(0) }),
      makeCheckIn({ energyLevel: 7, mood: "good", createdAt: daysAgo(1) }),
      makeCheckIn({ energyLevel: 7, mood: "good", createdAt: daysAgo(2) }),
    ]
    expect(evaluateAlertRules(recent, NOW)).toEqual([])
  })
})

// ─── Rule 1: Energy decline ───────────────────────────────────────────────────

describe("evaluateAlertRules — Rule 1: energy decline", () => {
  it(`fires when energy drops ≥${ALERT_ENERGY_DECLINE_THRESHOLD} from oldest to newest check-in`, () => {
    const recent = [
      makeCheckIn({ energyLevel: 3, createdAt: daysAgo(0) }),   // newest
      makeCheckIn({ energyLevel: 5, createdAt: daysAgo(1) }),
      makeCheckIn({ energyLevel: 3 + ALERT_ENERGY_DECLINE_THRESHOLD, createdAt: daysAgo(2) }), // oldest
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "energy_decline")).toBe(true)
  })

  it("does not fire when drop is below threshold", () => {
    const recent = [
      makeCheckIn({ energyLevel: 5, createdAt: daysAgo(0) }),
      makeCheckIn({ energyLevel: 6, createdAt: daysAgo(1) }),
      makeCheckIn({ energyLevel: 7, createdAt: daysAgo(2) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "energy_decline")).toBe(false)
  })

  it("does not fire when drop is exactly threshold minus 1", () => {
    const recent = [
      makeCheckIn({ energyLevel: 5, createdAt: daysAgo(0) }),
      makeCheckIn({ energyLevel: 6, createdAt: daysAgo(1) }),
      makeCheckIn({ energyLevel: 5 + ALERT_ENERGY_DECLINE_THRESHOLD - 1, createdAt: daysAgo(2) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "energy_decline")).toBe(false)
  })

  it("does not fire when there are fewer than 3 check-ins", () => {
    const recent = [
      makeCheckIn({ energyLevel: 1, createdAt: daysAgo(0) }),
      makeCheckIn({ energyLevel: 9, createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "energy_decline")).toBe(false)
  })

  it("sets severity 'high' when drop ≥ 5", () => {
    const recent = [
      makeCheckIn({ energyLevel: 2, createdAt: daysAgo(0) }),
      makeCheckIn({ energyLevel: 5, createdAt: daysAgo(1) }),
      makeCheckIn({ energyLevel: 8, createdAt: daysAgo(2) }),
    ]
    const alert = evaluateAlertRules(recent, NOW).find((a) => a.type === "energy_decline")
    expect(alert?.severity).toBe("high")
  })

  it("sets severity 'medium' when drop is 3–4", () => {
    const recent = [
      makeCheckIn({ energyLevel: 4, createdAt: daysAgo(0) }),
      makeCheckIn({ energyLevel: 5, createdAt: daysAgo(1) }),
      makeCheckIn({ energyLevel: 7, createdAt: daysAgo(2) }),
    ]
    const alert = evaluateAlertRules(recent, NOW).find((a) => a.type === "energy_decline")
    expect(alert?.severity).toBe("medium")
  })
})

// ─── Rule 2: Fatigue spike ────────────────────────────────────────────────────

describe("evaluateAlertRules — Rule 2: fatigue spike", () => {
  it(`fires when fatigue = ${ALERT_FATIGUE_SPIKE_THRESHOLD} (threshold)`, () => {
    expect(
      evaluateAlertRules([makeCheckIn({ symptomFatigue: ALERT_FATIGUE_SPIKE_THRESHOLD })], NOW)
        .some((a) => a.type === "fatigue_spike")
    ).toBe(true)
  })

  it("fires for fatigue above threshold", () => {
    expect(
      evaluateAlertRules([makeCheckIn({ symptomFatigue: ALERT_FATIGUE_SPIKE_THRESHOLD + 1 })], NOW)
        .some((a) => a.type === "fatigue_spike")
    ).toBe(true)
  })

  it("does not fire when fatigue is below threshold", () => {
    expect(
      evaluateAlertRules([makeCheckIn({ symptomFatigue: ALERT_FATIGUE_SPIKE_THRESHOLD - 1 })], NOW)
        .some((a) => a.type === "fatigue_spike")
    ).toBe(false)
  })

  it("does not fire when fatigue is null", () => {
    expect(
      evaluateAlertRules([makeCheckIn({ symptomFatigue: null })], NOW)
        .some((a) => a.type === "fatigue_spike")
    ).toBe(false)
  })

  it("sets severity 'high' for fatigue ≥ 9", () => {
    const alert = evaluateAlertRules([makeCheckIn({ symptomFatigue: 9 })], NOW)
      .find((a) => a.type === "fatigue_spike")
    expect(alert?.severity).toBe("high")
  })

  it("sets severity 'medium' for fatigue = 8", () => {
    const alert = evaluateAlertRules([makeCheckIn({ symptomFatigue: 8 })], NOW)
      .find((a) => a.type === "fatigue_spike")
    expect(alert?.severity).toBe("medium")
  })
})

// ─── Rule 3: Stress spike ─────────────────────────────────────────────────────

describe("evaluateAlertRules — Rule 3: stress spike", () => {
  it(`fires when stress = ${ALERT_STRESS_SPIKE_THRESHOLD} (threshold)`, () => {
    expect(
      evaluateAlertRules([makeCheckIn({ stressLevel: ALERT_STRESS_SPIKE_THRESHOLD })], NOW)
        .some((a) => a.type === "stress_spike")
    ).toBe(true)
  })

  it("does not fire when stress is below threshold", () => {
    expect(
      evaluateAlertRules([makeCheckIn({ stressLevel: ALERT_STRESS_SPIKE_THRESHOLD - 1 })], NOW)
        .some((a) => a.type === "stress_spike")
    ).toBe(false)
  })

  it("does not fire when stress is null", () => {
    expect(
      evaluateAlertRules([makeCheckIn({ stressLevel: null })], NOW)
        .some((a) => a.type === "stress_spike")
    ).toBe(false)
  })

  it("sets severity 'high' for stress ≥ 9", () => {
    const alert = evaluateAlertRules([makeCheckIn({ stressLevel: 9 })], NOW)
      .find((a) => a.type === "stress_spike")
    expect(alert?.severity).toBe("high")
  })

  it("sets severity 'medium' for stress = 8", () => {
    const alert = evaluateAlertRules([makeCheckIn({ stressLevel: 8 })], NOW)
      .find((a) => a.type === "stress_spike")
    expect(alert?.severity).toBe("medium")
  })
})

// ─── Rule 4: PEM cluster ──────────────────────────────────────────────────────

describe("evaluateAlertRules — Rule 4: PEM cluster", () => {
  it(`fires when ≥${ALERT_PEM_CLUSTER_COUNT} PEM flags within 7 days`, () => {
    const recent = [
      makeCheckIn({ pemFlag: true, createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: true, createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "pem_cluster")).toBe(true)
  })

  it("does not fire when PEM flags are outside the 7-day window", () => {
    const recent = [
      makeCheckIn({ pemFlag: true, createdAt: new Date(NOW.getTime() - SEVEN_DAYS_MS - DAY_MS) }),
      makeCheckIn({ pemFlag: true, createdAt: new Date(NOW.getTime() - SEVEN_DAYS_MS - 2 * DAY_MS) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "pem_cluster")).toBe(false)
  })

  it("does not fire with only 1 PEM flag", () => {
    const recent = [
      makeCheckIn({ pemFlag: true, createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: false, createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "pem_cluster")).toBe(false)
  })

  it("does not count null pemFlag as a PEM episode", () => {
    const recent = [
      makeCheckIn({ pemFlag: null, createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: null, createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "pem_cluster")).toBe(false)
  })

  it("always sets severity 'high'", () => {
    const recent = [
      makeCheckIn({ pemFlag: true, createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: true, createdAt: daysAgo(1) }),
    ]
    const alert = evaluateAlertRules(recent, NOW).find((a) => a.type === "pem_cluster")
    expect(alert?.severity).toBe("high")
  })
})

// ─── Rule 5: Mood decline ─────────────────────────────────────────────────────

describe("evaluateAlertRules — Rule 5: mood decline", () => {
  // recent is newest-first; moodDrop = newest_score - oldest_score (negative = decline)

  it("fires when mood drops from excellent to neutral over 3 check-ins", () => {
    const recent = [
      makeCheckIn({ mood: "neutral", createdAt: daysAgo(0) }),    // newest, score 3
      makeCheckIn({ mood: "good", createdAt: daysAgo(1) }),        // score 4
      makeCheckIn({ mood: "excellent", createdAt: daysAgo(2) }),   // oldest, score 5
    ]
    // moodDrop = 3 - 5 = -2, threshold <= -2 → fires
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "mood_decline")).toBe(true)
  })

  it("fires when mood drops from excellent to very_low (high severity)", () => {
    const recent = [
      makeCheckIn({ mood: "very_low", createdAt: daysAgo(0) }),   // score 1
      makeCheckIn({ mood: "low", createdAt: daysAgo(1) }),         // score 2
      makeCheckIn({ mood: "excellent", createdAt: daysAgo(2) }),   // score 5
    ]
    // moodDrop = 1 - 5 = -4, <= -3 → high severity
    const alert = evaluateAlertRules(recent, NOW).find((a) => a.type === "mood_decline")
    expect(alert).toBeDefined()
    expect(alert?.severity).toBe("high")
  })

  it("does not fire when mood improved over 3 check-ins", () => {
    const recent = [
      makeCheckIn({ mood: "excellent", createdAt: daysAgo(0) }),   // newest, score 5
      makeCheckIn({ mood: "good", createdAt: daysAgo(1) }),         // score 4
      makeCheckIn({ mood: "neutral", createdAt: daysAgo(2) }),     // oldest, score 3
    ]
    // moodDrop = 5 - 3 = +2 (improvement, not decline) → should NOT fire
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "mood_decline")).toBe(false)
  })

  it("does not fire when mood drop is only 1 point", () => {
    const recent = [
      makeCheckIn({ mood: "good", createdAt: daysAgo(0) }),        // score 4
      makeCheckIn({ mood: "good", createdAt: daysAgo(1) }),         // score 4
      makeCheckIn({ mood: "excellent", createdAt: daysAgo(2) }),   // score 5
    ]
    // moodDrop = 4 - 5 = -1 (not enough) → should NOT fire
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "mood_decline")).toBe(false)
  })

  it("does not fire when there are fewer than 3 check-ins", () => {
    const recent = [
      makeCheckIn({ mood: "very_low", createdAt: daysAgo(0) }),
      makeCheckIn({ mood: "excellent", createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "mood_decline")).toBe(false)
  })

  it("sets severity 'medium' for 2-point drop", () => {
    const recent = [
      makeCheckIn({ mood: "neutral", createdAt: daysAgo(0) }),     // score 3
      makeCheckIn({ mood: "good", createdAt: daysAgo(1) }),         // score 4
      makeCheckIn({ mood: "excellent", createdAt: daysAgo(2) }),   // score 5
    ]
    const alert = evaluateAlertRules(recent, NOW).find((a) => a.type === "mood_decline")
    expect(alert?.severity).toBe("medium")
  })
})

// ─── Rule 6: Orthostatic cluster ──────────────────────────────────────────────

describe("evaluateAlertRules — Rule 6: orthostatic cluster", () => {
  it(`fires when ≥${ALERT_ORTHOSTATIC_CLUSTER_COUNT} orthostatic episodes within 7 days`, () => {
    const recent = [
      makeCheckIn({ orthostaticSymptoms: true, createdAt: daysAgo(0) }),
      makeCheckIn({ orthostaticSymptoms: true, createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "orthostatic_intolerance")).toBe(true)
  })

  it("does not fire when episodes are outside the 7-day window", () => {
    const recent = [
      makeCheckIn({ orthostaticSymptoms: true, createdAt: new Date(NOW.getTime() - SEVEN_DAYS_MS - DAY_MS) }),
      makeCheckIn({ orthostaticSymptoms: true, createdAt: new Date(NOW.getTime() - SEVEN_DAYS_MS - 2 * DAY_MS) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "orthostatic_intolerance")).toBe(false)
  })

  it("does not fire with only 1 episode", () => {
    const recent = [
      makeCheckIn({ orthostaticSymptoms: true, createdAt: daysAgo(0) }),
      makeCheckIn({ orthostaticSymptoms: false, createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.type === "orthostatic_intolerance")).toBe(false)
  })

  it("always sets severity 'medium'", () => {
    const recent = [
      makeCheckIn({ orthostaticSymptoms: true, createdAt: daysAgo(0) }),
      makeCheckIn({ orthostaticSymptoms: true, createdAt: daysAgo(1) }),
    ]
    const alert = evaluateAlertRules(recent, NOW).find((a) => a.type === "orthostatic_intolerance")
    expect(alert?.severity).toBe("medium")
  })
})

// ─── Rule 7: PEM lag pattern ──────────────────────────────────────────────────

describe("evaluateAlertRules — Rule 7: PEM lag pattern", () => {
  it("fires when today has PEM and prior day had moderate activity", () => {
    const recent = [
      makeCheckIn({ pemFlag: true, activityLevel: "light", createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: false, activityLevel: "moderate", createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.title === "PEM lag detected")).toBe(true)
  })

  it("fires when today has PEM and 2 days ago had active activity", () => {
    const recent = [
      makeCheckIn({ pemFlag: true, activityLevel: "light", createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: false, activityLevel: "light", createdAt: daysAgo(1) }),
      makeCheckIn({ pemFlag: false, activityLevel: "active", createdAt: daysAgo(2) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.title === "PEM lag detected")).toBe(true)
  })

  it("does not fire when no PEM today", () => {
    const recent = [
      makeCheckIn({ pemFlag: false, activityLevel: "light", createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: false, activityLevel: "moderate", createdAt: daysAgo(1) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.title === "PEM lag detected")).toBe(false)
  })

  it("does not fire when prior days had only light or sedentary activity", () => {
    const recent = [
      makeCheckIn({ pemFlag: true, activityLevel: "light", createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: false, activityLevel: "light", createdAt: daysAgo(1) }),
      makeCheckIn({ pemFlag: false, activityLevel: "sedentary", createdAt: daysAgo(2) }),
    ]
    expect(evaluateAlertRules(recent, NOW).some((a) => a.title === "PEM lag detected")).toBe(false)
  })

  it("uses type pem_cluster and severity high", () => {
    const recent = [
      makeCheckIn({ pemFlag: true, activityLevel: "light", createdAt: daysAgo(0) }),
      makeCheckIn({ pemFlag: false, activityLevel: "moderate", createdAt: daysAgo(1) }),
    ]
    const alert = evaluateAlertRules(recent, NOW).find((a) => a.title === "PEM lag detected")
    expect(alert?.type).toBe("pem_cluster")
    expect(alert?.severity).toBe("high")
  })
})

// ─── Multiple rules in one call ───────────────────────────────────────────────

describe("evaluateAlertRules — multiple rules", () => {
  it("returns multiple alert types when several rules fire simultaneously", () => {
    const recent = [
      makeCheckIn({
        energyLevel: 2,
        symptomFatigue: 9,
        stressLevel: 9,
        pemFlag: true,
        mood: "very_low",
        createdAt: daysAgo(0),
      }),
      makeCheckIn({ energyLevel: 5, pemFlag: true, mood: "neutral", createdAt: daysAgo(1) }),
      makeCheckIn({ energyLevel: 8, mood: "excellent", createdAt: daysAgo(2) }),
    ]
    const alerts = evaluateAlertRules(recent, NOW)
    const types = alerts.map((a) => a.type)
    expect(types).toContain("energy_decline")
    expect(types).toContain("fatigue_spike")
    expect(types).toContain("stress_spike")
    expect(types).toContain("pem_cluster")
    expect(types).toContain("mood_decline")
  })
})
