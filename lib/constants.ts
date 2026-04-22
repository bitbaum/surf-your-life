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
export const SLEEP_QUALITY_SCALE = { min: 1, max: 5 } as const

export const SLEEP_QUALITY_OPTIONS = [
  { value: 1, emoji: "😫", labelKey: "sleepQualityVeryPoor" },
  { value: 2, emoji: "😕", labelKey: "sleepQualityPoor" },
  { value: 3, emoji: "😐", labelKey: "sleepQualityFair" },
  { value: 4, emoji: "🙂", labelKey: "sleepQualityGood" },
  { value: 5, emoji: "😴", labelKey: "sleepQualityExcellent" },
] as const

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
export const BRAND_NAME = "Surf Your Life"
export const COMPANY_ADDRESS = "Surf Your Life · Zollikerstrasse 183, 8008 Zürich"

// AI model identifiers — update here when upgrading models
export const AI_MODEL_FAST = "claude-haiku-4-5-20251001"

// Practitioner note on check-ins
export const PRACTITIONER_NOTE_MAX_LENGTH = 1000

// Time constants (milliseconds)
export const DAY_MS = 24 * 60 * 60 * 1000
export const SEVEN_DAYS_MS = 7 * DAY_MS
export const THIRTY_DAYS_MS = 30 * DAY_MS
export const NINETY_DAYS_MS = 90 * DAY_MS

// Valid booking time preference values (schema SSOT)
export const BOOKING_TIME_PREFERENCE_VALUES = ["morning", "afternoon", "flexible"] as const

// List size limits
export const RECENT_CHECK_INS_LIMIT = 5
export const WELLNESS_CHART_WINDOW_DAYS = 30
export const AT_RISK_CLIENTS_LIMIT = 5
export const RECENT_CLIENTS_LIMIT = 8
export const SERVICES_MAX_LIMIT = 100
export const DOCUMENTS_PER_CLIENT_LIMIT = PAGINATION_DEFAULT
export const ADMIN_DASHBOARD_ALERTS_PREVIEW = 10

// SVG chart dimensions (shared by all inline charts)
export const CHART_W = 800
export const CHART_H = 220
export const CHART_PAD = { top: 20, right: 20, bottom: 36, left: 8 } as const
// Tooltip flip thresholds — right of this fraction → flip left; left of this → flip right
export const CHART_TOOLTIP_RIGHT_THRESHOLD = 0.65
export const CHART_TOOLTIP_LEFT_THRESHOLD = 0.35

// Mood numeric scale for charts (maps mood enum values to [0,1])
export const MOOD_NUMERIC: Record<string, number> = {
  very_low: 0,
  low: 0.25,
  neutral: 0.5,
  good: 0.75,
  excellent: 1,
}

// Mood integer score for clinical averaging (1–5 scale).
// Use MOOD_NUMERIC for chart percentages; use MOOD_SCORE for averaging across check-ins.
export const MOOD_SCORE: Record<string, number> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  excellent: 5,
}

// Sleep chart display cap (hours above this are clamped visually)
export const SLEEP_CHART_MAX_HOURS = 10

// Symptom severity scale (used by check-in form sliders and Zod validation)
export const SYMPTOM_SCALE = { min: 1, max: 10, default: 5 } as const

// PEM severity scale (Post-Exertional Malaise, Long COVID / ME-CFS)
export const PEM_SEVERITY_SCALE = { min: 1, max: 10, default: 5 } as const

// Activity level options for check-in (ordered: rest → light → moderate → active)
export const ACTIVITY_LEVELS = [
  { value: "rest",     emoji: "🛌", labelKey: "activityRest" },
  { value: "light",    emoji: "🚶", labelKey: "activityLight" },
  { value: "moderate", emoji: "🏃", labelKey: "activityModerate" },
  { value: "active",   emoji: "⚡", labelKey: "activityActive" },
] as const

// Functional capacity assessment scale
export const CAPACITY_SCALE = { min: 1, max: 10, default: 5 } as const

// Technique categories (matches techniqueCategoryEnum in schema)
export const TECHNIQUE_CATEGORIES = [
  { value: "breathwork",  emoji: "🌬️", labelKey: "categoryBreathwork" },
  { value: "movement",    emoji: "🏃", labelKey: "categoryMovement" },
  { value: "mindfulness", emoji: "🧘", labelKey: "categoryMindfulness" },
  { value: "cognitive",   emoji: "🧠", labelKey: "categoryCognitive" },
  { value: "pacing",      emoji: "⏱️", labelKey: "categoryPacing" },
  { value: "sleep",       emoji: "😴", labelKey: "categorySleep" },
  { value: "social",      emoji: "🤝", labelKey: "categorySocial" },
] as const

// Technique difficulty levels (matches techniqueDifficultyEnum in schema)
export const TECHNIQUE_DIFFICULTIES = [
  { value: "easy",        labelKey: "difficultyEasy" },
  { value: "moderate",    labelKey: "difficultyModerate" },
  { value: "challenging", labelKey: "difficultyChallenging" },
] as const

// Technique debt / catch-up safety defaults (clinical: protect Long COVID / PEM clients)
// safetyCapMultiplier: stored ×100 in DB. 150 = 1.5× the daily target max catch-up per day.
export const TECHNIQUE_DEFAULT_FREQUENCY = 1
export const TECHNIQUE_DEFAULT_SAFETY_CAP = 150 // 1.5×
export const TECHNIQUE_DEFAULT_MAX_DEBT_DAYS = 7 // debt older than 7 days is forgiven

// AI chat limits
export const AI_CHAT_HISTORY_LIMIT = 20  // messages sent as context to AI
export const AI_CHAT_MAX_LENGTH = 1000   // max user message character length

// Alert generation thresholds
export const ALERT_ENERGY_DECLINE_THRESHOLD = 3  // drop of ≥3 over last 3 check-ins
export const ALERT_FATIGUE_SPIKE_THRESHOLD = 8   // fatigue ≥ 8
export const ALERT_STRESS_SPIKE_THRESHOLD = 8    // stress ≥ 8
export const ALERT_MISSED_CHECKINS_DAYS = 5      // no check-in in 5+ days
export const ALERT_PEM_CLUSTER_COUNT = 2         // 2+ PEM flags in last 7 days

// AI digest thresholds
export const AI_DIGEST_MIN_CHECKINS = 3  // minimum check-ins in window to generate AI digest

// Document type → i18n key mapping (namespace: admin.clients.sessionNotes)
export const DOC_TYPE_I18N_KEYS: Record<string, string> = {
  session_note: "typeSessionNote",
  assessment: "typeAssessment",
  report: "typeReport",
  upload: "typeUpload",
}
