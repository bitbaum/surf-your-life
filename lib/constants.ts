// SSOT for all display values, enum mappings, and magic numbers.
// Import from here — never hardcode these inline.

export const MOODS = [
  { value: "very_low", label: "Very low", emoji: "😔" },
  { value: "low", label: "Low", emoji: "😕" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "excellent", label: "Excellent", emoji: "😄" },
] as const

export const MAIN_CONCERNS = [
  "burnout",
  "long_covid",
  "midlife_reinvention",
  "general_wellbeing",
  "other",
] as const

export const ENERGY_SCALE = { min: 1, max: 10, default: 5 } as const
export const SLEEP_HOURS = { min: 0, max: 24 } as const
export const QUALITY_SCALE = { min: 1, max: 10, default: 5 } as const

// Fields required for onboarding completion check
export const ONBOARDING_REQUIRED_FIELDS = ["mainConcern", "goals"] as const

// Fields that count toward profile completeness (DB column names, for dashboard)
export const PROFILE_COMPLETION_FIELDS = [
  "mainConcern",
  "goals",
  "currentSituation",
  "occupation",
  "exerciseFrequency",
  "sleepQuality",
  "stressLevel",
  "existingDiagnoses",
  "familyHistory",
  "heightCm",
  "weightKg",
] as const

// Fields for wizard progress tracking (FormState key names)
export const WIZARD_COMPLETION_FIELDS = [
  "name",
  "gender",
  "dobDay",
  "occupation",
  "mainConcerns",
  "currentSituation",
  "goals",
  "existingDiagnoses",
  "familyHistory",
  "medications",
  "heightCm",
  "weightKg",
  "exerciseFrequency",
] as const

// Wizard step config
export const PROFILE_WIZARD_STEPS = [
  { key: "stepYouTitle",        fields: ["name", "gender", "dobDay", "occupation"] },
  { key: "stepChallengesTitle", fields: ["mainConcerns"] },
  { key: "stepStoryTitle",      fields: ["currentSituation", "goals"] },
  { key: "stepHealthTitle",     fields: ["existingDiagnoses", "familyHistory", "medications"] },
  { key: "stepLifestyleTitle",  fields: ["heightCm", "weightKg", "exerciseFrequency"] },
] as const

export const PAGINATION_DEFAULT = 20

// Lookup maps derived from MOODS — import these instead of redefining inline
export const MOOD_EMOJI = Object.fromEntries(MOODS.map((m) => [m.value, m.emoji])) as Record<string, string>
export const MOOD_LABEL = Object.fromEntries(MOODS.map((m) => [m.value, m.label])) as Record<string, string>

export const SITE_URL = process.env.AUTH_URL ?? "https://surf-your-life.ch"

// Time constants (milliseconds)
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
