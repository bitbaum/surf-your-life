"use client"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import type { FormState } from "../profile-form"

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

const textareaClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"

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
          min={50}
          max={300}
          value={form.heightCm}
          onChange={(e) => onChange("heightCm", e.target.value)}
          placeholder={t("heightPlaceholder")}
        />
        <Input
          label={t("weightLabel")}
          type="number"
          min={20}
          max={500}
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
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("alcoholTobaccoLabel")}</label>
        <textarea
          value={form.alcoholTobacco}
          onChange={(e) => onChange("alcoholTobacco", e.target.value)}
          rows={2}
          placeholder={t("alcoholTobaccoPlaceholder")}
          className={textareaClass}
        />
      </div>
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
