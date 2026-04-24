"use client"

import { useTranslations } from "next-intl"
import { SYMPTOM_SCALE, COMPACT_LABEL_CLS } from "@/lib/constants"

interface Props {
  fatigue: number | null
  setFatigue: (v: number | null) => void
  brainFog: number | null
  setBrainFog: (v: number | null) => void
  pain: number | null
  setPain: (v: number | null) => void
  stress: number | null
  setStress: (v: number | null) => void
}

export function EditSymptomsSection({ fatigue, setFatigue, brainFog, setBrainFog, pain, setPain, stress, setStress }: Props) {
  const t = useTranslations("portal.checkIns")
  const tCheckIn = useTranslations("portal.checkIn")

  const fields = [
    { label: tCheckIn("symptomFatigue"), value: fatigue, set: setFatigue },
    { label: tCheckIn("symptomBrainFog"), value: brainFog, set: setBrainFog },
    { label: tCheckIn("symptomPain"), value: pain, set: setPain },
    { label: tCheckIn("stressLevel"), value: stress, set: setStress },
  ]

  return (
    <div>
      <p className={`${COMPACT_LABEL_CLS} mb-1`}>
        {t("editSymptomsLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
      </p>
      <p className="text-xs text-slate-400 mb-3">{t("editSymptomsHint")}</p>
      <div className="flex flex-col gap-3">
        {fields.map(({ label, value, set }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-600">{label}</span>
              {value != null ? (
                <span className="text-xs font-medium text-slate-700">{value}/10</span>
              ) : (
                <button
                  type="button"
                  onClick={() => set(SYMPTOM_SCALE.default)}
                  className="text-xs text-teal-600 hover:underline"
                >
                  {t("editSymptomsEnable")}
                </button>
              )}
            </div>
            {value != null && (
              <input
                type="range"
                min={SYMPTOM_SCALE.min}
                max={SYMPTOM_SCALE.max}
                value={value}
                onChange={(e) => set(parseInt(e.target.value))}
                className="w-full accent-teal-600"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
