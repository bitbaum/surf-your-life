"use client"

import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { MAIN_CONCERNS, FIELD_MAX_TITLE, FIELD_MAX_LONG } from "@/lib/constants"
import { formatEnumValue } from "@/lib/utils"

interface FormState {
  title: string
  description: string
  durationWeeks: string
  targetConcern: string
  isTemplate: boolean
}

interface Props {
  form: FormState
  onChange: (field: string, value: string | boolean) => void
}

export function ProgramBasicFields({ form, onChange }: Props) {
  const t = useTranslations("admin.programs")

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-title" className="text-sm font-medium text-slate-700">{t("fieldTitle")} *</label>
        <Input
          id="edit-title"
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          required
          maxLength={FIELD_MAX_TITLE}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-description" className="text-sm font-medium text-slate-700">{t("fieldDescription")}</label>
        <textarea
          id="edit-description"
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          maxLength={FIELD_MAX_LONG}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-duration" className="text-sm font-medium text-slate-700">{t("fieldDuration")}</label>
          <Input
            id="edit-duration"
            type="number"
            min={1}
            max={104}
            value={form.durationWeeks}
            onChange={(e) => onChange("durationWeeks", e.target.value)}
            placeholder={t("fieldDurationPlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-concern" className="text-sm font-medium text-slate-700">{t("fieldTargetConcern")}</label>
          <select
            id="edit-concern"
            value={form.targetConcern}
            onChange={(e) => onChange("targetConcern", e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 min-h-[44px]"
          >
            <option value="">{t("fieldTargetConcernAny")}</option>
            {MAIN_CONCERNS.map((c) => (
              <option key={c} value={c}>{formatEnumValue(c)}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isTemplate}
          onChange={(e) => onChange("isTemplate", e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <span className="text-sm text-slate-700">{t("fieldIsTemplate")}</span>
      </label>
    </>
  )
}
