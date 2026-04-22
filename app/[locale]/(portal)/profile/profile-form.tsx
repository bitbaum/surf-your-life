"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { PROFILE_WIZARD_STEPS, WIZARD_COMPLETION_FIELDS } from "@/lib/constants"
import type { Profile } from "@/lib/db/schema"
import { StepYou } from "./steps/step-you"
import { StepChallenges } from "./steps/step-challenges"
import { StepStory } from "./steps/step-story"
import { StepHealth } from "./steps/step-health"
import { StepLifestyle } from "./steps/step-lifestyle"
import { WizardProgress } from "./wizard-progress"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDob(iso: string | null | undefined) {
  if (!iso) return { day: "", month: "", year: "" }
  const [y, m, d] = iso.split("-")
  return { day: d ?? "", month: m ?? "", year: y ?? "" }
}

function buildDob(day: string, month: string, year: string) {
  if (!day || !month || !year) return ""
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

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

function toFormState(profile: Profile | null, initialName: string): FormState {
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

function isFilled(form: FormState, field: string): boolean {
  if (field === "mainConcerns") return form.mainConcerns.length > 0
  const val = (form as Record<string, unknown>)[field]
  if (typeof val === "string") return val.trim().length > 0
  if (typeof val === "number") return true
  // booleans (checkboxes) don't count toward completion
  return false
}

function calcProgress(form: FormState): number {
  const filled = WIZARD_COMPLETION_FIELDS.filter((f) => isFilled(form, f)).length
  return Math.round((filled / WIZARD_COMPLETION_FIELDS.length) * 100)
}

function isStepComplete(form: FormState, stepIdx: number): boolean {
  const step = PROFILE_WIZARD_STEPS[stepIdx]
  return step.fields.every((f) => isFilled(form, f))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileForm({ profile, initialName }: { profile: Profile | null; initialName: string }) {
  const t = useTranslations("portal.profile")
  const [step, setStep] = useState(0) // 0-indexed
  const [form, setForm] = useState<FormState>(toFormState(profile, initialName))
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalSteps = PROFILE_WIZARD_STEPS.length
  const pct = calcProgress(form)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleConcern(value: string) {
    setForm((prev) => {
      const next = prev.mainConcerns.includes(value)
        ? prev.mainConcerns.filter((c) => c !== value)
        : [...prev.mainConcerns, value]
      return { ...prev, mainConcerns: next }
    })
    setSaved(false)
  }

  function updateDob(field: "dobDay" | "dobMonth" | "dobYear", value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function buildPayload(f: FormState) {
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

  async function autoSave(f: FormState) {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(f)),
    })
    if (res.ok) setSaved(true)
  }

  async function handleNext() {
    setLoading(true)
    await autoSave(form)
    setStep((s) => s + 1)
    setLoading(false)
  }

  async function handleBack() {
    setLoading(true)
    await autoSave(form)
    setStep((s) => s - 1)
    setLoading(false)
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await autoSave(form)
    setLoading(false)
  }

  const stepTitles = PROFILE_WIZARD_STEPS.map((s) => t(s.key as Parameters<typeof t>[0]))
  const stepsCompleted = PROFILE_WIZARD_STEPS.map((_, i) => isStepComplete(form, i))

  return (
    <form onSubmit={handleFinish} className="flex flex-col gap-6 pb-16">
      <WizardProgress step={step} totalSteps={totalSteps} pct={pct} saved={saved} stepTitles={stepTitles} stepsCompleted={stepsCompleted} />

      {/* Step title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">{stepTitles[step]}</h2>
      </div>

      {/* Active step */}
      {step === 0 && <StepYou form={form} onChange={set} updateDob={updateDob} />}
      {step === 1 && <StepChallenges form={form} onToggle={toggleConcern} />}
      {step === 2 && <StepStory form={form} onChange={set} />}
      {step === 3 && <StepHealth form={form} onChange={set} />}
      {step === 4 && <StepLifestyle form={form} onChange={set} />}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={loading || step === 0}
        >
          ← {t("back")}
        </Button>
        {step < totalSteps - 1 ? (
          <Button type="button" onClick={handleNext} disabled={loading}>
            {loading ? t("saving") : t("next")} →
          </Button>
        ) : (
          <Button type="submit" disabled={loading}>
            {loading ? t("saving") : t("saveAndFinish")}
          </Button>
        )}
      </div>
    </form>
  )
}
