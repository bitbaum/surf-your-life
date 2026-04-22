"use client"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import type { FormState } from "../profile-form.helpers"

const textareaClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"

export function StepHealth({
  form,
  onChange,
}: {
  form: FormState
  onChange: <K extends keyof FormState>(key: K, val: FormState[K]) => void
}) {
  const t = useTranslations("portal.profile")

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <input
          id="prev-therapy"
          type="checkbox"
          checked={form.previousTherapy}
          onChange={(e) => onChange("previousTherapy", e.target.checked)}
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
          onChange={(e) => onChange("existingDiagnoses", e.target.value)}
          rows={2}
          placeholder={t("diagnosesPlaceholder")}
          className={textareaClass}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("familyHistoryLabel")}</label>
        <textarea
          value={form.familyHistory}
          onChange={(e) => onChange("familyHistory", e.target.value)}
          rows={2}
          placeholder={t("familyHistoryPlaceholder")}
          className={textareaClass}
        />
      </div>
      <Input
        label={`${t("medicationsLabel")} ${t("medicationsOptional")}`}
        value={form.medications}
        onChange={(e) => onChange("medications", e.target.value)}
        placeholder={t("medicationsPlaceholder")}
      />
    </div>
  )
}
