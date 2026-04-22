"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { SYMPTOM_SCALE } from "@/lib/constants"

type Symptoms = { fatigue: number; brainFog: number; pain: number; stress: number }

interface Props {
  trackSymptoms: boolean
  setTrackSymptoms: (v: boolean) => void
  symptoms: Symptoms
  setSymptoms: (updater: (prev: Symptoms) => Symptoms) => void
}

export function SymptomsCard({ trackSymptoms, setTrackSymptoms, symptoms, setSymptoms }: Props) {
  const t = useTranslations("portal.checkIn")

  const fields = [
    { key: "fatigue" as const, label: t("symptomFatigue") },
    { key: "brainFog" as const, label: t("symptomBrainFog") },
    { key: "pain" as const, label: t("symptomPain") },
    { key: "stress" as const, label: t("stressLevel") },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("symptomsCard")}</CardTitle>
            <CardDescription className="mt-0.5">{t("symptomsDescription")}</CardDescription>
          </div>
          <button
            type="button"
            onClick={() => setTrackSymptoms(!trackSymptoms)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              trackSymptoms
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {trackSymptoms ? t("symptomsHide") : t("symptomsShow")}
          </button>
        </div>
      </CardHeader>
      {trackSymptoms && (
        <CardContent className="flex flex-col gap-5">
          <p className="text-xs text-slate-400">{t("symptomsHint")}</p>
          {fields.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">{label}</label>
                <span className="text-sm font-bold text-slate-800 w-8 text-right">{symptoms[key]}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-4">{SYMPTOM_SCALE.min}</span>
                <input
                  type="range"
                  min={SYMPTOM_SCALE.min}
                  max={SYMPTOM_SCALE.max}
                  value={symptoms[key]}
                  onChange={(e) => setSymptoms((s) => ({ ...s, [key]: parseInt(e.target.value) }))}
                  className="flex-1 accent-teal-600"
                />
                <span className="text-xs text-slate-400 w-4">{SYMPTOM_SCALE.max}</span>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
