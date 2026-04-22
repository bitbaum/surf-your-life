"use client"

import { useTranslations } from "next-intl"
import { TECHNIQUE_CATEGORIES, TECHNIQUE_DIFFICULTIES, TECHNIQUE_NAME_MAX, FIELD_MAX_NOTES, FIELD_MAX_LONG, TECHNIQUE_DURATION_MINUTES } from "@/lib/constants"

export type TechniqueFormState = {
  name: string
  description: string
  category: string
  instructions: string
  durationMinutes: string
  difficulty: string
  resourceUrl: string
}

type FieldBinder = (key: keyof TechniqueFormState) => {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
}

interface TechniqueFormFieldsProps {
  field: FieldBinder
}

export function TechniqueFormFields({ field }: TechniqueFormFieldsProps) {
  const t = useTranslations("admin.techniques")
  const inputCls = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldName")} *</label>
        <input {...field("name")} required maxLength={TECHNIQUE_NAME_MAX} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldCategory")} *</label>
          <select {...field("category")} required className={`${inputCls} bg-white`}>
            {TECHNIQUE_CATEGORIES.map(({ value, emoji }) => (
              <option key={value} value={value}>{emoji} {t(`category.${value}`)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldDifficulty")} *</label>
          <select {...field("difficulty")} required className={`${inputCls} bg-white`}>
            {TECHNIQUE_DIFFICULTIES.map(({ value }) => (
              <option key={value} value={value}>{t(`difficulty.${value}`)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldDescription")}</label>
        <textarea {...field("description")} rows={2} maxLength={FIELD_MAX_NOTES} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldInstructions")}</label>
        <textarea {...field("instructions")} rows={4} maxLength={FIELD_MAX_LONG} placeholder={t("instructionsPlaceholder")} className={`${inputCls} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldDuration")}</label>
          <input type="number" min={TECHNIQUE_DURATION_MINUTES.min} max={TECHNIQUE_DURATION_MINUTES.max} placeholder="10" {...field("durationMinutes")} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldResourceUrl")}</label>
          <input type="url" {...field("resourceUrl")} placeholder={t("fieldResourceUrlPlaceholder")} className={inputCls} />
        </div>
      </div>
    </>
  )
}
