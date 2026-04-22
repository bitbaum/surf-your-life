import { PROFILE_WIZARD_STEPS, WIZARD_COMPLETION_FIELDS } from "@/lib/constants"
import type { Profile } from "@/lib/db/schema"

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormState = {
  name: string
  gender: string
  dobDay: string
  dobMonth: string
  dobYear: string
  occupation: string
  workHoursPerWeek: string
  insuranceProvider: string
  mainConcerns: string[]
  currentSituation: string
  goals: string
  existingDiagnoses: string
  familyHistory: string
  previousTherapy: boolean
  medications: string
  heightCm: string
  weightKg: string
  sleepQuality: number
  sleepSchedule: string
  exerciseFrequency: string
  alcoholTobacco: string
  socialSupport: number
  stressLevel: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDob(iso: string | null | undefined) {
  if (!iso) return { day: "", month: "", year: "" }
  const [y, m, d] = iso.split("-")
  return { day: d ?? "", month: m ?? "", year: y ?? "" }
}

export function buildDob(day: string, month: string, year: string) {
  if (!day || !month || !year) return ""
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

export function toFormState(profile: Profile | null, initialName: string): FormState {
  const dob = parseDob(profile?.dateOfBirth)
  return {
    name: initialName,
    gender: profile?.gender ?? "",
    dobDay: dob.day,
    dobMonth: dob.month,
    dobYear: dob.year,
    occupation: profile?.occupation ?? "",
    workHoursPerWeek: profile?.workHoursPerWeek?.toString() ?? "",
    insuranceProvider: profile?.insuranceProvider ?? "",
    mainConcerns: profile?.mainConcern?.split(",").filter(Boolean) ?? [],
    currentSituation: profile?.currentSituation ?? "",
    goals: profile?.goals ?? "",
    existingDiagnoses: profile?.existingDiagnoses ?? "",
    familyHistory: profile?.familyHistory ?? "",
    previousTherapy: profile?.previousTherapy ?? false,
    medications: profile?.medications ?? "",
    heightCm: profile?.heightCm?.toString() ?? "",
    weightKg: profile?.weightKg?.toString() ?? "",
    sleepQuality: profile?.sleepQuality ?? 5,
    sleepSchedule: profile?.sleepSchedule ?? "",
    exerciseFrequency: profile?.exerciseFrequency ?? "",
    alcoholTobacco: profile?.alcoholTobacco ?? "",
    socialSupport: profile?.socialSupport ?? 5,
    stressLevel: profile?.stressLevel ?? 5,
  }
}

export function isFilled(form: FormState, field: string): boolean {
  if (field === "mainConcerns") return form.mainConcerns.length > 0
  const val = (form as Record<string, unknown>)[field]
  if (typeof val === "string") return val.trim().length > 0
  if (typeof val === "number") return true
  // booleans (checkboxes) don't count toward completion
  return false
}

export function calcProgress(form: FormState): number {
  const filled = WIZARD_COMPLETION_FIELDS.filter((f) => isFilled(form, f)).length
  return Math.round((filled / WIZARD_COMPLETION_FIELDS.length) * 100)
}

export function isStepComplete(form: FormState, stepIdx: number): boolean {
  const step = PROFILE_WIZARD_STEPS[stepIdx]
  return step.fields.every((f) => isFilled(form, f))
}

export function buildPayload(f: FormState) {
  return {
    name: f.name,
    gender: f.gender || undefined,
    dateOfBirth: buildDob(f.dobDay, f.dobMonth, f.dobYear) || undefined,
    occupation: f.occupation || undefined,
    workHoursPerWeek: f.workHoursPerWeek ? parseInt(f.workHoursPerWeek) : null,
    insuranceProvider: f.insuranceProvider || undefined,
    mainConcern: f.mainConcerns.join(",") || undefined,
    currentSituation: f.currentSituation || undefined,
    goals: f.goals || undefined,
    existingDiagnoses: f.existingDiagnoses || undefined,
    familyHistory: f.familyHistory || undefined,
    previousTherapy: f.previousTherapy,
    medications: f.medications || undefined,
    heightCm: f.heightCm ? Math.round(parseFloat(f.heightCm)) : null,
    weightKg: f.weightKg ? Math.round(parseFloat(f.weightKg)) : null,
    sleepQuality: f.sleepQuality,
    sleepSchedule: f.sleepSchedule || undefined,
    exerciseFrequency: f.exerciseFrequency || undefined,
    alcoholTobacco: f.alcoholTobacco || undefined,
    socialSupport: f.socialSupport,
    stressLevel: f.stressLevel,
  }
}
