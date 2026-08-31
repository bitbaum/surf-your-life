/**
 * SSOT for every form the assistant is allowed to fill or change.
 *
 * A form appears here once. The API route reads this list to decide what the
 * model may write, and the form component reads the same specs — so a field
 * cannot exist for the model and not for the UI, or the other way round.
 *
 * Option lists and bounds are imported from lib/constants, which already
 * defines them. Never retype a scale or an enum here.
 *
 * The writable field names are deliberately identical to `ParsedFields` in
 * lib/domain/check-in-parse. That is what lets the keyword parser stand in for
 * the model when there is no API key: both paths produce the same shape, so the
 * fallback is a real fallback rather than a degraded one.
 */

import { defineFields, type FormTarget } from "@fleet/ai-forms";
import {
  ACTIVITY_LEVELS,
  ENERGY_SCALE,
  FIELD_MAX_JOURNAL,
  MOODS,
  SLEEP_HOURS,
  SYMPTOM_SCALE,
} from "@/lib/constants";

const severity = (name: string, label: string) => ({
  name,
  label,
  type: "number" as const,
  min: SYMPTOM_SCALE.min,
  max: SYMPTOM_SCALE.max,
  hint: `${SYMPTOM_SCALE.min} = none, ${SYMPTOM_SCALE.max} = severe. Only set it if the text says something about this symptom.`,
});

export const CHECK_IN_FORM: FormTarget = {
  key: "check-in",
  name: "Daily check-in",
  fields: defineFields([
    {
      name: "mood",
      label: "Mood",
      type: "select",
      required: true,
      options: MOODS.map((m) => ({ value: m.value, label: m.label })),
    },
    {
      name: "energyLevel",
      label: "Energy level",
      type: "number",
      min: ENERGY_SCALE.min,
      max: ENERGY_SCALE.max,
      hint: `${ENERGY_SCALE.min} = exhausted, ${ENERGY_SCALE.max} = fully charged.`,
    },
    {
      name: "sleepHours",
      label: "Hours slept",
      type: "number",
      min: SLEEP_HOURS.min,
      max: SLEEP_HOURS.max,
    },
    {
      name: "activityLevel",
      label: "Activity level",
      type: "select",
      options: ACTIVITY_LEVELS.map((a) => ({ value: a.value })),
      hint: "How much the person did today: rest = stayed in bed, active = exercise or a busy day.",
    },
    {
      name: "pemFlag",
      label: "Post-exertional malaise",
      type: "boolean",
      hint: "True only if they describe crashing or getting worse after activity.",
    },
    {
      name: "orthostaticSymptoms",
      label: "Dizziness on standing",
      type: "boolean",
      hint: "True only if they mention dizziness, light-headedness or vertigo.",
    },
    severity("symptomFatigue", "Fatigue"),
    severity("symptomBrainFog", "Brain fog"),
    severity("symptomPain", "Physical pain"),
    severity("symptomStress", "Stress"),
    {
      name: "journalEntry",
      label: "Journal",
      type: "textarea",
      maxLength: FIELD_MAX_JOURNAL,
      hint: "The person's own account of their day, tidied up. Never your commentary about it.",
    },

    // Excluded on purpose. Sleep quality and PEM severity are only rendered
    // once another answer reveals them, and a model must not set a field the
    // person cannot see to check. `trackSymptoms` is a UI disclosure toggle,
    // not data — the form derives it from whether any symptom got a value.
    { name: "sleepQuality", label: "Sleep quality", type: "number", aiExcluded: true },
    { name: "pemSeverity", label: "PEM severity", type: "number", aiExcluded: true },
    { name: "trackSymptoms", label: "Track symptoms", type: "boolean", aiExcluded: true },
  ]),
  instructions: [
    "This is a health check-in written by the person themselves. Record what they said; never diagnose, reassure or advise.",
    "Leave a field out when the text does not support it. A guessed symptom score becomes their medical record.",
    "The person may write in German, French or English. Answer with the option values as given, whatever language they used.",
  ],
};

/** Every form the assistant may touch. The client can only name these keys. */
export const AI_FORMS: readonly FormTarget[] = [CHECK_IN_FORM];
