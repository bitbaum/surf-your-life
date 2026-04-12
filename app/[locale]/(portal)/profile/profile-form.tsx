"use client"

import { useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MAIN_CONCERNS, QUALITY_SCALE } from "@/lib/constants"
import { CheckCircle } from "lucide-react"
import type { Profile } from "@/lib/db/schema"

// ─── Date of birth helper ─────────────────────────────────────────────────────

function parseDob(iso: string | null | undefined) {
  if (!iso) return { day: "", month: "", year: "" }
  const [y, m, d] = iso.split("-")
  return { day: d ?? "", month: m ?? "", year: y ?? "" }
}

function buildDob(day: string, month: string, year: string) {
  if (!day || !month || !year) return ""
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}

function getMonthNames(locale: string) {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, i, 1))
  )
}

// ─── Slider field ─────────────────────────────────────────────────────────────

function SliderField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-slate-400 w-3">1</span>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 accent-teal-600"
        />
        <span className="text-xs text-slate-400 w-3">10</span>
        <span className="text-lg font-bold text-teal-700 w-6 text-center">{value}</span>
      </div>
    </div>
  )
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
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
    sleepQuality: profile?.sleepQuality ?? QUALITY_SCALE.default,
    sleepSchedule: profile?.sleepSchedule ?? "",
    exerciseFrequency: profile?.exerciseFrequency ?? "",
    alcoholTobacco: profile?.alcoholTobacco ?? "",
    socialSupport: profile?.socialSupport ?? QUALITY_SCALE.default,
    stressLevel: profile?.stressLevel ?? QUALITY_SCALE.default,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileForm({ profile, initialName }: { profile: Profile | null; initialName: string }) {
  const t = useTranslations("portal.profile")
  const locale = useLocale()
  const monthNames = getMonthNames(locale)

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<FormState>(toFormState(profile, initialName))

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      name: form.name,
      gender: form.gender || undefined,
      dateOfBirth: buildDob(form.dobDay, form.dobMonth, form.dobYear) || undefined,
      occupation: form.occupation || undefined,
      workHoursPerWeek: form.workHoursPerWeek ? parseInt(form.workHoursPerWeek) : null,
      insuranceProvider: form.insuranceProvider || undefined,
      mainConcern: form.mainConcerns.join(",") || undefined,
      currentSituation: form.currentSituation || undefined,
      goals: form.goals || undefined,
      existingDiagnoses: form.existingDiagnoses || undefined,
      familyHistory: form.familyHistory || undefined,
      previousTherapy: form.previousTherapy,
      medications: form.medications || undefined,
      heightCm: form.heightCm ? parseInt(form.heightCm) : null,
      weightKg: form.weightKg ? parseInt(form.weightKg) : null,
      sleepQuality: form.sleepQuality,
      sleepSchedule: form.sleepSchedule || undefined,
      exerciseFrequency: form.exerciseFrequency || undefined,
      alcoholTobacco: form.alcoholTobacco || undefined,
      socialSupport: form.socialSupport,
      stressLevel: form.stressLevel,
    }
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setSaved(true)
    setLoading(false)
  }

  const selectClass =
    "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Save banner */}
      {saved && (
        <div className="sticky top-4 z-10 flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-white shadow-lg">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{t("saveSuccessAt")} ✓</span>
        </div>
      )}

      {/* About you */}
      <Card>
        <CardHeader>
          <CardTitle>{t("aboutCard")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <Input
              label={t("nameLabel")}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t("namePlaceholder")}
            />
            <p className="text-xs text-slate-400 mt-1">{t("namePrivacyNote")}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("genderLabel")}</label>
            <select
              value={form.gender}
              onChange={(e) => set("gender", e.target.value)}
              className={selectClass}
            >
              <option value="">—</option>
              <option value="male">{t("genderMale")}</option>
              <option value="female">{t("genderFemale")}</option>
              <option value="other">{t("genderOther")}</option>
              <option value="prefer_not">{t("genderPreferNot")}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("dateOfBirth")}</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={form.dobDay}
                onChange={(e) => updateDob("dobDay", e.target.value)}
                className={selectClass}
              >
                <option value="">{t("dobDay")}</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d).padStart(2, "0")}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={form.dobMonth}
                onChange={(e) => updateDob("dobMonth", e.target.value)}
                className={selectClass}
              >
                <option value="">{t("dobMonth")}</option>
                {monthNames.map((name, i) => (
                  <option key={i} value={String(i + 1).padStart(2, "0")}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={form.dobYear}
                onChange={(e) => updateDob("dobYear", e.target.value)}
                className={selectClass}
              >
                <option value="">{t("dobYear")}</option>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 15 - i).map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label={t("occupation")}
            value={form.occupation}
            onChange={(e) => set("occupation", e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("workHoursLabel")}
              type="number"
              min={0}
              max={168}
              value={form.workHoursPerWeek}
              onChange={(e) => set("workHoursPerWeek", e.target.value)}
              placeholder={t("workHoursPlaceholder")}
            />
            <Input
              label={t("insuranceLabel")}
              value={form.insuranceProvider}
              onChange={(e) => set("insuranceProvider", e.target.value)}
              placeholder={t("insurancePlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main concerns — multi-select */}
      <Card>
        <CardHeader>
          <CardTitle>{t("concernsCard")}</CardTitle>
          <p className="text-xs text-slate-400 mt-1">{t("concernsNote")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MAIN_CONCERNS.map((opt) => {
              const selected = form.mainConcerns.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleConcern(opt.value)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left flex items-center gap-2 ${
                    selected
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      selected ? "border-teal-500 bg-teal-500" : "border-slate-300"
                    }`}
                  >
                    {selected && <span className="text-white text-xs">✓</span>}
                  </span>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Situation & goals */}
      <Card>
        <CardHeader>
          <CardTitle>{t("situationCard")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("situationLabel")}</label>
            <textarea
              value={form.currentSituation}
              onChange={(e) => set("currentSituation", e.target.value)}
              rows={4}
              placeholder={t("situationPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("goalsLabel")}</label>
            <textarea
              value={form.goals}
              onChange={(e) => set("goals", e.target.value)}
              rows={4}
              placeholder={t("goalsPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical history */}
      <Card>
        <CardHeader>
          <CardTitle>{t("healthCard")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <input
              id="prev-therapy"
              type="checkbox"
              checked={form.previousTherapy}
              onChange={(e) => set("previousTherapy", e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-teal-600"
            />
            <label htmlFor="prev-therapy" className="text-sm text-slate-700 leading-snug">
              {t("prevTherapyLabel")}
            </label>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("diagnosesLabel")}</label>
            <textarea
              value={form.existingDiagnoses}
              onChange={(e) => set("existingDiagnoses", e.target.value)}
              rows={2}
              placeholder={t("diagnosesPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("familyHistoryLabel")}</label>
            <textarea
              value={form.familyHistory}
              onChange={(e) => set("familyHistory", e.target.value)}
              rows={2}
              placeholder={t("familyHistoryPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <Input
            label={`${t("medicationsLabel")} ${t("medicationsOptional")}`}
            value={form.medications}
            onChange={(e) => set("medications", e.target.value)}
            placeholder={t("medicationsPlaceholder")}
          />
        </CardContent>
      </Card>

      {/* Physical */}
      <Card>
        <CardHeader>
          <CardTitle>{t("physicalCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t("heightLabel")}
              type="number"
              min={50}
              max={300}
              value={form.heightCm}
              onChange={(e) => set("heightCm", e.target.value)}
              placeholder="e.g. 175"
            />
            <Input
              label={t("weightLabel")}
              type="number"
              min={20}
              max={500}
              value={form.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
              placeholder="e.g. 72"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lifestyle */}
      <Card>
        <CardHeader>
          <CardTitle>{t("lifestyleCard")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Input
            label={t("exerciseLabel")}
            value={form.exerciseFrequency}
            onChange={(e) => set("exerciseFrequency", e.target.value)}
            placeholder={t("exercisePlaceholder")}
          />
          <Input
            label={t("sleepScheduleLabel")}
            value={form.sleepSchedule}
            onChange={(e) => set("sleepSchedule", e.target.value)}
            placeholder={t("sleepSchedulePlaceholder")}
          />
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("alcoholTobaccoLabel")}</label>
            <textarea
              value={form.alcoholTobacco}
              onChange={(e) => set("alcoholTobacco", e.target.value)}
              rows={2}
              placeholder={t("alcoholTobaccoPlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <SliderField
            label={t("sleepQualityLabel")}
            value={form.sleepQuality}
            onChange={(v) => set("sleepQuality", v)}
          />
          <SliderField
            label={t("stressLevelLabel")}
            value={form.stressLevel}
            onChange={(v) => set("stressLevel", v)}
          />
          <SliderField
            label={t("socialSupportLabel")}
            hint={t("socialSupportHint")}
            value={form.socialSupport}
            onChange={(v) => set("socialSupport", v)}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pb-8">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? t("saving") : t("save")}
        </Button>
      </div>
    </form>
  )
}
