"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MAIN_CONCERNS, QUALITY_SCALE } from "@/lib/constants"
import type { Profile } from "@/lib/db/schema"

type FormState = {
  occupation: string
  dateOfBirth: string
  mainConcern: string
  currentSituation: string
  goals: string
  previousTherapy: boolean
  medications: string
  sleepQuality: number
  stressLevel: number
  exerciseFrequency: string
}

function toFormState(profile: Profile | null): FormState {
  return {
    occupation: profile?.occupation ?? "",
    dateOfBirth: profile?.dateOfBirth ?? "",
    mainConcern: profile?.mainConcern ?? "",
    currentSituation: profile?.currentSituation ?? "",
    goals: profile?.goals ?? "",
    previousTherapy: profile?.previousTherapy ?? false,
    medications: profile?.medications ?? "",
    sleepQuality: profile?.sleepQuality ?? QUALITY_SCALE.default,
    stressLevel: profile?.stressLevel ?? QUALITY_SCALE.default,
    exerciseFrequency: profile?.exerciseFrequency ?? "",
  }
}

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const t = useTranslations("portal.profile")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState<FormState>(toFormState(profile))

  function set(key: keyof FormState, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaved(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader><CardTitle>About you</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input label="Occupation" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Your current or last role" />
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your main concern</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MAIN_CONCERNS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("mainConcern", opt.value)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                  form.mainConcern === opt.value
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Your situation &amp; goals</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Current situation</label>
            <textarea
              value={form.currentSituation}
              onChange={(e) => set("currentSituation", e.target.value)}
              rows={3}
              placeholder="Describe where you are right now — what's going on in your life?"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Goals</label>
            <textarea
              value={form.goals}
              onChange={(e) => set("goals", e.target.value)}
              rows={3}
              placeholder="What do you want to achieve? What does success look like for you?"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Health context</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <input
              id="prev-therapy"
              type="checkbox"
              checked={form.previousTherapy}
              onChange={(e) => set("previousTherapy", e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <label htmlFor="prev-therapy" className="text-sm text-slate-700">
              I have been in therapy or psychiatric treatment before
            </label>
          </div>
          <Input
            label="Current medications (optional)"
            value={form.medications}
            onChange={(e) => set("medications", e.target.value)}
            placeholder="Leave blank if none"
          />
          <Input
            label="Exercise frequency"
            value={form.exerciseFrequency}
            onChange={(e) => set("exerciseFrequency", e.target.value)}
            placeholder="e.g. 3x per week, daily walks, none"
          />
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Sleep quality (1–10)</label>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={10} value={form.sleepQuality} onChange={(e) => set("sleepQuality", parseInt(e.target.value))} className="flex-1 accent-teal-600" />
              <span className="text-lg font-bold text-teal-700 w-6 text-center">{form.sleepQuality}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Stress level (1–10)</label>
            <div className="flex items-center gap-4">
              <input type="range" min={1} max={10} value={form.stressLevel} onChange={(e) => set("stressLevel", parseInt(e.target.value))} className="flex-1 accent-teal-600" />
              <span className="text-lg font-bold text-teal-700 w-6 text-center">{form.stressLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading} size="lg">
          {loading ? t("saving") : t("save")}
        </Button>
        {saved && <span className="text-sm text-teal-600 font-medium">{t("saveSuccess")} ✓</span>}
      </div>
    </form>
  )
}
