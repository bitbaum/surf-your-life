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
  { value: "burnout", label: "Burnout" },
  { value: "long_covid", label: "Long COVID" },
  { value: "midlife_reinvention", label: "Midlife reinvention" },
  { value: "general_wellbeing", label: "General wellbeing" },
  { value: "other", label: "Other" },
] as const

export const ENERGY_SCALE = { min: 1, max: 10, default: 5 } as const
export const SLEEP_HOURS = { min: 0, max: 24 } as const
export const QUALITY_SCALE = { min: 1, max: 10, default: 5 } as const

// Fields required for onboarding completion check
export const ONBOARDING_REQUIRED_FIELDS = ["mainConcern", "goals"] as const

// Fields that count toward profile completeness (for progress indicator)
export const PROFILE_COMPLETION_FIELDS = [
  "mainConcern",
  "goals",
  "currentSituation",
  "occupation",
  "exerciseFrequency",
  "sleepQuality",
  "stressLevel",
] as const

export const PAGINATION_DEFAULT = 20
