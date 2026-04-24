// SSOT for all display values, enum mappings, and magic numbers.
// Import from here — never hardcode these inline.

import { mainConcernEnum } from "@/lib/db/schema"

export const MOODS = [
  { value: "very_low", label: "Very low", emoji: "😔", labelKey: "moodVeryLow" },
  { value: "low", label: "Low", emoji: "😕", labelKey: "moodLow" },
  { value: "neutral", label: "Neutral", emoji: "😐", labelKey: "moodNeutral" },
  { value: "good", label: "Good", emoji: "🙂", labelKey: "moodGood" },
  { value: "excellent", label: "Excellent", emoji: "😄", labelKey: "moodExcellent" },
] as const

export const MAIN_CONCERNS = mainConcernEnum.enumValues

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
export const MOOD_COLOR: Record<string, string> = {
  very_low: "bg-red-300",
  low: "bg-orange-300",
  neutral: "bg-slate-300",
  good: "bg-teal-300",
  excellent: "bg-teal-500",
}

export const SITE_URL = process.env.AUTH_URL ?? "https://surf-your-life.ch"
export const BRAND_NAME = "Surf Your Life"
export const COMPANY_ADDRESS = "Surf Your Life · Zollikerstrasse 183, 8008 Zürich"

// AI model identifiers — update here when upgrading models
export const AI_MODEL_FAST = "claude-haiku-4-5-20251001"
export const EMBEDDING_MODEL = "text-embedding-3-small"
export const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings"

// Practitioner note on check-ins
export const PRACTITIONER_NOTE_MAX_LENGTH = 1000

// Authentication constraints
export const PASSWORD_MIN_LENGTH = 8
export const BCRYPT_SALT_ROUNDS = 12

// Standard API error message strings — used in all route handlers for consistent responses
export const API_ERR_UNAUTHORIZED = "Unauthorized"
export const API_ERR_FORBIDDEN = "Forbidden"
export const API_ERR_NOT_FOUND = "Not found"
export const API_ERR_INVALID_INPUT = "Invalid input"
export const API_ERR_RATE_LIMITED = "Too many requests. Please try again later."
export const API_ERR_SERVICE_UNAVAILABLE = "Service not available"
export const API_ERR_BOOKING_DUPLICATE = "You already have an active booking for this service"
export const API_ERR_SLOT_TAKEN = "This time slot is no longer available. Please choose another."
export const API_ERR_CHECKIN_DUPLICATE = "Already checked in today"
export const API_ERR_BOOKING_ALREADY_CANCELLED = "Already cancelled"
export const API_ERR_EMAIL_TAKEN = "An account with this email already exists"
export const API_ERR_EMAIL_ALREADY_VERIFIED = "Email already verified"
export const API_ERR_INVALID_TOKEN = "Invalid or expired token"
export const API_ERR_PASSWORD_REQUIRED = "Password required"
export const API_ERR_NO_PASSWORD_AUTH = "Password authentication not available"
export const API_ERR_WRONG_PASSWORD = "Incorrect password"
export const API_ERR_SELF_ROLE_CHANGE = "Cannot change your own role"
export const API_ERR_SERVER_ERROR = "Something went wrong. Please try again."

// Time constants (milliseconds)
export const HOUR_MS = 60 * 60 * 1000
export const DAY_MS = 24 * HOUR_MS
export const SEVEN_DAYS_MS = 7 * DAY_MS
export const THIRTY_DAYS_MS = 30 * DAY_MS
export const NINETY_DAYS_MS = 90 * DAY_MS

// Valid booking time preference values (schema SSOT)
export const BOOKING_TIME_PREFERENCE_VALUES = ["morning", "afternoon", "flexible"] as const
export type BookingTimePreference = (typeof BOOKING_TIME_PREFERENCE_VALUES)[number]

// List size limits
export const RECENT_CHECK_INS_LIMIT = 5
export const WELLNESS_CHART_WINDOW_DAYS = 30
export const AT_RISK_CLIENTS_LIMIT = 5
export const RECENT_CLIENTS_LIMIT = 8
export const SERVICES_MAX_LIMIT = 100
export const TECHNIQUES_MAX = 200              // safety cap for technique library (admin)
export const CLIENT_ASSIGNMENTS_MAX = 50       // max active technique assignments per client
export const ADMIN_ENROLLMENTS_MAX = 200       // safety cap for program enrollment list

// Active booking statuses — pending and confirmed (i.e. not yet cancelled)
export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const
export const DOCUMENTS_PER_CLIENT_LIMIT = PAGINATION_DEFAULT
export const DOCUMENT_UPLOAD_MAX_CONTENT = 5000  // max chars for client-submitted upload text
export const DOCUMENT_ADMIN_MAX_CONTENT = 10000  // max chars for practitioner-authored documents
export const EMBED_BACKFILL_BATCH = 50           // records processed per cron run during backfill
export const ADMIN_DASHBOARD_ALERTS_PREVIEW = 10
export const CLIENT_ASSESSMENTS_LIMIT = 10        // assessments shown in admin client detail
export const ADMIN_ALERTS_MAX = 500              // safety cap for unresolved alerts page
export const ADMIN_AT_RISK_MAX = 500             // safety cap for full at-risk clients page
export const ADMIN_PROGRAMS_MAX = 200            // safety cap for programs list
export const ASSESSMENTS_MAX = 200               // safety cap for functional assessments per user
export const ADMIN_DASHBOARD_INSIGHTS_PREVIEW = 6
export const DASHBOARD_INSIGHT_ENERGY_WINDOW = 3  // recent energy levels used for portal insight calculation

// SVG chart dimensions (shared by all inline charts)
export const CHART_W = 800
export const CHART_H = 220
export const CHART_PAD = { top: 20, right: 20, bottom: 36, left: 8 } as const
export const CHART_PLOT_W = CHART_W - CHART_PAD.left - CHART_PAD.right
export const CHART_PLOT_H = CHART_H - CHART_PAD.top - CHART_PAD.bottom
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

export const DIFFICULTY_BADGE_CLASSES: Record<string, string> = {
  easy:        "bg-teal-50 text-teal-700 border-teal-200",
  moderate:    "bg-amber-50 text-amber-700 border-amber-200",
  challenging: "bg-red-50 text-red-700 border-red-200",
}

// Technique debt / catch-up safety defaults (clinical: protect Long COVID / PEM clients)
// safetyCapMultiplier: stored ×100 in DB. 150 = 1.5× the daily target max catch-up per day.
export const TECHNIQUE_DEFAULT_FREQUENCY = 1
export const TECHNIQUE_DEFAULT_SAFETY_CAP = 150 // 1.5×
export const TECHNIQUE_DEFAULT_MAX_DEBT_DAYS = 7 // debt older than 7 days is forgiven
export const TECHNIQUE_LOG_WINDOW_DAYS = 14      // days of logs fetched for debt computation (2× forgiveness window)
export const TECHNIQUE_DAILY_FREQUENCY_MAX = 10  // max reps/sessions per day
export const TECHNIQUE_LOG_MAX_REPS = 20          // max reps that can be logged in a single log entry
export const TECHNIQUE_DURATION_MINUTES = { min: 1, max: 120 } as const  // per-session duration
// Adherence badge thresholds (days completed out of 7-day window)
export const ADHERENCE_GOOD_DAYS = 6  // ≥6/7 → teal (good)
export const ADHERENCE_OK_DAYS   = 4  // ≥4/7 → amber (ok); <4 → red (poor)

// Program duration bounds (weeks)
export const PROGRAM_DURATION_WEEKS_MAX = 104     // 2 years

// Service duration bounds (minutes): 5 min → 8 hours
export const SERVICE_DURATION_MINUTES = { min: 5, max: 480 } as const

// Profile biometric bounds
export const WORK_HOURS_WEEK_MAX = 168            // 24 × 7 — max realistic weekly hours
export const HEIGHT_CM = { min: 50, max: 300 } as const
export const WEIGHT_KG = { min: 20, max: 500 } as const

// AI chat limits
export const AI_CHAT_HISTORY_LIMIT = 20   // messages fetched from DB for the AI context window
export const AI_CHAT_CONTEXT_WINDOW = 10  // messages actually sent to Claude (tail of history)
export const AI_CHAT_DISPLAY_LIMIT = 50   // messages loaded for display in the chat UI
export const AI_CHAT_MAX_LENGTH = 1000    // max user message character length

// Session prep (AI pre-session briefing)
export const SESSION_PREP_CHECKIN_LIMIT = 10  // recent check-ins included in briefing
export const SESSION_PREP_ALERTS_LIMIT = 5    // recent alerts included in briefing
export const SESSION_PREP_ENERGY_AVG_WINDOW = 5  // check-ins used for energy average calculation

// Streak calculation
export const STREAK_LOOKBACK_DAYS = 30  // max days to look back when calculating check-in streaks

// Alert severity display order — most critical first (used by alert list grouping)
export const ALERT_SEVERITY_ORDER = ["high", "medium", "low"] as const

// Toggle chip state classes — selected/unselected for single-select and multi-select chip groups
export const CHIP_SELECTED = "border-teal-500 bg-teal-50 text-teal-700"
export const CHIP_UNSELECTED = "border-slate-200 text-slate-600 hover:border-slate-300"

// Compact uppercase section label base classes — append margin (mb-1, mb-1.5, mb-2) at each use site
export const COMPACT_LABEL_CLS = "text-xs font-medium text-slate-500 uppercase tracking-wide"

// Enrollment status badge classes — used by portal program page and admin enrollment-status component
export const ENROLLMENT_STATUS_BADGE: Record<string, string> = {
  active:    "bg-teal-50 text-teal-700 border border-teal-200",
  paused:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
  completed: "bg-slate-100 text-slate-600 border border-slate-200",
}

// Booking status → Badge variant — used by portal booking list and admin bookings page
export const BOOKING_STATUS_BADGE_VARIANT: Record<string, "yellow" | "teal" | "slate"> = {
  pending:   "yellow",
  confirmed: "teal",
  cancelled: "slate",
}
// Pending booking age thresholds for urgency badge on admin bookings page
export const BOOKING_AGE_URGENT_DAYS = 3   // ≥3 days old → red (needs immediate attention)
export const BOOKING_AGE_WARN_DAYS   = 1   // ≥1 day old → amber (follow up soon)

// User role → Badge variant — used by admin users page and role-button component
export const ROLE_BADGE_VARIANT: Record<string, "teal" | "blue" | "slate"> = {
  admin:        "teal",
  practitioner: "blue",
  client:       "slate",
}

// Alert severity color config — canonical mapping used by all alert UI components
// Dot = filled circle indicator; Badge = label pill with border
export const ALERT_SEVERITY_DOT: Record<string, string> = {
  high:   "bg-red-500",
  medium: "bg-amber-500",
  low:    "bg-yellow-400",
}
export const ALERT_SEVERITY_BADGE: Record<string, string> = {
  high:   "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low:    "bg-yellow-50 text-yellow-700 border-yellow-200",
}

// Alert generation thresholds
export const ALERT_CHECKIN_WINDOW = 7            // check-ins fetched for alert evaluation
export const ALERT_ENERGY_DECLINE_THRESHOLD = 3  // drop of ≥3 over last 3 check-ins
export const ALERT_MOOD_DECLINE_WINDOW = 3        // check-ins compared for mood decline rule
export const ALERT_MOOD_DECLINE_THRESHOLD = -2    // mood score drop to trigger alert
export const ALERT_FATIGUE_SPIKE_THRESHOLD = 8   // fatigue ≥ 8
export const ALERT_STRESS_SPIKE_THRESHOLD = 8    // stress ≥ 8
export const ALERT_MISSED_CHECKINS_DAYS = 5      // no check-in in 5+ days
export const ALERT_PEM_CLUSTER_COUNT = 2         // 2+ PEM flags in last 7 days
export const ALERT_ORTHOSTATIC_CLUSTER_COUNT = 2 // 2+ orthostatic episodes in last 7 days

// AI context limits
export const AI_CONTEXT_CHECKINS = 14  // recent check-ins included as AI context
export const AI_CHAT_CHECKIN_CONTEXT_LIMIT = 10  // check-ins summarised in AI chat context
export const AI_CHAT_JOURNAL_EXCERPT_LENGTH = 100 // max journal chars included per check-in in AI context

// AI digest thresholds
export const AI_DIGEST_MIN_CHECKINS = 3  // minimum check-ins in window to generate AI digest

// Document type → i18n key mapping (namespace: admin.clients.sessionNotes)
export const DOC_TYPE_I18N_KEYS: Record<string, string> = {
  session_note: "typeSessionNote",
  assessment: "typeAssessment",
  report: "typeReport",
  upload: "typeUpload",
}

// Document type → badge Tailwind classes
export const DOC_TYPE_BADGE_CLASSES: Record<string, string> = {
  assessment: "bg-violet-50 text-violet-700 border-violet-200",
  report: "bg-blue-50 text-blue-700 border-blue-200",
  session_note: "bg-teal-50 text-teal-700 border-teal-200",
  upload: "bg-slate-100 text-slate-600 border-slate-200",
}

// Form field max lengths — import these instead of hardcoding numbers in components
export const FIELD_MAX_TITLE = 200          // short single-line fields: title, subject, name
export const FIELD_MAX_SHORT = 100          // very short fields: dose, frequency
export const FIELD_MAX_NOTES = 500          // brief notes / short description
export const TECHNIQUE_NAME_MAX = 120       // technique name (tighter than generic title)
export const FIELD_MAX_MEDIUM = 1000        // medium text areas: NLP entry, AI chat message
export const FIELD_MAX_LONG = 2000          // long descriptions, instructions, goals
export const FIELD_MAX_JOURNAL = 3000       // check-in journal / reflection
export const FIELD_MAX_MESSAGE = 5000       // message body text
export const EMAIL_MAX_LENGTH = 254         // RFC 5321 maximum email address length

// pgvector embedding dimensions — must match the vector(1536) columns in lib/db/schema.ts
// (schema cannot import this constant without creating a circular dependency)
export const EMBEDDING_DIMENSIONS = 1536

// Assessment capacity dimensions (ordered: overall first, then sub-dimensions)
export const ASSESSMENT_DIMENSIONS = [
  { key: "overallCapacity",   required: true },
  { key: "physicalCapacity",  required: false },
  { key: "cognitiveCapacity", required: false },
  { key: "emotionalCapacity", required: false },
  { key: "socialCapacity",    required: false },
] as const
