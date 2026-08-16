/**
 * Guards for the AI-assisted check-in form.
 *
 * Two things here can drift apart silently and neither shows up as a type
 * error, because the model's output is JSON at runtime:
 *
 *  1. The option values the model is offered vs the enum values the check-in
 *     API accepts. A mismatch is a form that fills itself in and then refuses
 *     to save.
 *  2. The field names in the registry vs the field names keywordParse emits.
 *     A mismatch means the no-API-key deployment quietly fills in nothing,
 *     which looks exactly like "the text had nothing in it".
 */

import { describe, expect, it } from "vitest"
import { runFormAssist } from "@fleet/ai-forms"
import { CHECK_IN_FORM } from "@/lib/config/ai-forms"
import { keywordFallback, keywordParse } from "@/lib/domain/check-in-parse"
import { ACTIVITY_LEVELS, ENERGY_SCALE, MOODS, SYMPTOM_SCALE } from "@/lib/constants"

const field = (name: string) => {
  const spec = CHECK_IN_FORM.fields.find((f) => f.name === name)
  if (!spec) throw new Error(`No field "${name}" in CHECK_IN_FORM`)
  return spec
}

const writable = CHECK_IN_FORM.fields.filter((f) => !f.aiExcluded).map((f) => f.name)

/** Stands in for the route's `complete` on a deployment with no ANTHROPIC_API_KEY. */
const keylessComplete = (instruction: string, intent: "fill" | "refine") => async () =>
  JSON.stringify({ values: keywordFallback(instruction, intent), message: "" })

describe("CHECK_IN_FORM — options match the constants that validate them", () => {
  it("offers exactly the moods the app defines", () => {
    expect(field("mood").options?.map((o) => o.value)).toEqual(MOODS.map((m) => m.value))
  })

  it("offers exactly the activity levels the app defines", () => {
    expect(field("activityLevel").options?.map((o) => o.value)).toEqual(
      ACTIVITY_LEVELS.map((a) => a.value)
    )
  })

  it("bounds energy and symptoms by the same scales the sliders use", () => {
    expect([field("energyLevel").min, field("energyLevel").max]).toEqual([
      ENERGY_SCALE.min,
      ENERGY_SCALE.max,
    ])
    for (const name of ["symptomFatigue", "symptomBrainFog", "symptomPain", "symptomStress"]) {
      expect([field(name).min, field(name).max]).toEqual([SYMPTOM_SCALE.min, SYMPTOM_SCALE.max])
    }
  })
})

describe("CHECK_IN_FORM — writable fields match what keywordParse emits", () => {
  it("declares every field the keyword parser can produce", () => {
    // A sentence deliberately touching every extractable field.
    const parsed = keywordParse(
      "Slept 7 hours, energy was 4, went for a short walk and crashed after, dizzy standing up, " +
        "fatigue 6, brain fog 5, pain 8, stress 7. Terrible day overall."
    )
    for (const name of Object.keys(parsed)) {
      expect(writable, `keywordParse emits "${name}" but the registry has no writable field for it`)
        .toContain(name)
    }
  })

  it("keeps the fields the person cannot see out of the model's reach", () => {
    for (const name of ["sleepQuality", "pemSeverity", "trackSymptoms"]) {
      expect(field(name).aiExcluded).toBe(true)
      expect(writable).not.toContain(name)
    }
  })
})

describe("keyless fill — the form still works with no model", () => {
  const instruction =
    "Slept 7 hours, energy was 4, did a short walk but crashed after. Pain 8. Rough day."

  it("lands the parsed values in the form", async () => {
    const result = await runFormAssist({
      target: CHECK_IN_FORM,
      request: { intent: "fill", instruction, values: {} },
      complete: keylessComplete(instruction, "fill"),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.values.sleepHours).toBe(7)
    expect(result.values.energyLevel).toBe(4)
    expect(result.values.symptomPain).toBe(8)
    expect(result.values.mood).toBe("low")
    expect(result.values.journalEntry).toBe(instruction)
    expect(result.changed).toContain("sleepHours")
  })

  it("protects what the person already typed", async () => {
    const result = await runFormAssist({
      target: CHECK_IN_FORM,
      request: { intent: "fill", instruction, values: { mood: "excellent" } },
      complete: keylessComplete(instruction, "fill"),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.values.mood).toBe("excellent")
    expect(result.changed).not.toContain("mood")
  })
})

describe("keyless refine — a correction changes the form, not the journal", () => {
  const instruction = "pain was a 9"

  it("applies the correction over an existing value", async () => {
    const result = await runFormAssist({
      target: CHECK_IN_FORM,
      request: {
        intent: "refine",
        instruction,
        values: { symptomPain: 5, journalEntry: "A quiet day at home." },
      },
      complete: keylessComplete(instruction, "refine"),
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.values.symptomPain).toBe(9)
    // The refine instruction is a correction, not a new journal entry. Without
    // the guard in keywordFallback this would read "the pain was more like a 9".
    expect(result.values.journalEntry).toBe("A quiet day at home.")
    expect(result.changed).toEqual(["symptomPain"])
  })

  it("does not treat a refine instruction as a journal entry", () => {
    expect(keywordFallback(instruction, "refine").journalEntry).toBeUndefined()
    expect(keywordFallback(instruction, "fill").journalEntry).toBe(instruction)
  })

  it("reports honestly when the keyword parser cannot read the correction", async () => {
    // keywordParse only looks 15 characters past the keyword for a number, so
    // "the pain was more like a 9" (17) is out of its reach. Pinned because the
    // right behaviour is a visible "nothing changed", not a silent no-op — and
    // because this is precisely the gap that having a model configured closes.
    const wordy = "the pain was more like a 9"
    expect(keywordFallback(wordy, "refine").symptomPain).not.toBe(9)

    const result = await runFormAssist({
      target: CHECK_IN_FORM,
      request: { intent: "refine", instruction: wordy, values: { symptomPain: 5 } },
      complete: keylessComplete(wordy, "refine"),
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/nothing changed/i)
  })
})
