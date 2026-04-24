"use client"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { QUALITY_SCALE, HEIGHT_CM, WEIGHT_KG } from "@/lib/constants"
import type { FormState } from "../profile-form.helpers"

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
        <span className="text-xs text-slate-400 w-3">{QUALITY_SCALE.min}</span>
        <input
          type="range"
          min={QUALITY_SCALE.min}
          max={QUALITY_SCALE.max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 accent-teal-600"
        />
        <span className="text-xs text-slate-400 w-3">{QUALITY_SCALE.max}</span>
        <span className="text-lg font-bold text-teal-700 w-6 text-center">{value}</span>
      </div>
    </div>
  )
}

export function StepLifestyle({
  form,
  onChange,
}: {
  form: FormState
  onChange: <K extends keyof FormState>(key: K, val: FormState[K]) => void
}) {
  const t = useTranslations("portal.profile")

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("heightLabel")}
          type="number"
          min={HEIGHT_CM.min}
          max={HEIGHT_CM.max}
          value={form.heightCm}
          onChange={(e) => onChange("heightCm", e.target.value)}
          placeholder={t("heightPlaceholder")}
        />
        <Input
          label={t("weightLabel")}
          type="number"
          min={WEIGHT_KG.min}
          max={WEIGHT_KG.max}
          value={form.weightKg}
          onChange={(e) => onChange("weightKg", e.target.value)}
          placeholder={t("weightPlaceholder")}
        />
      </div>
      <Input
        label={t("exerciseLabel")}
        value={form.exerciseFrequency}
        onChange={(e) => onChange("exerciseFrequency", e.target.value)}
        placeholder={t("exercisePlaceholder")}
      />
      <Input
        label={t("sleepScheduleLabel")}
        value={form.sleepSchedule}
        onChange={(e) => onChange("sleepSchedule", e.target.value)}
        placeholder={t("sleepSchedulePlaceholder")}
      />
      <Textarea
        label={t("alcoholTobaccoLabel")}
        value={form.alcoholTobacco}
        onChange={(e) => onChange("alcoholTobacco", e.target.value)}
        rows={2}
        placeholder={t("alcoholTobaccoPlaceholder")}
      />
      <SliderField
        label={t("sleepQualityLabel")}
        value={form.sleepQuality}
        onChange={(v) => onChange("sleepQuality", v)}
      />
      <SliderField
        label={t("stressLevelLabel")}
        value={form.stressLevel}
        onChange={(v) => onChange("stressLevel", v)}
      />
      <SliderField
        label={t("socialSupportLabel")}
        hint={t("socialSupportHint")}
        value={form.socialSupport}
        onChange={(v) => onChange("socialSupport", v)}
      />
    </div>
  )
}
