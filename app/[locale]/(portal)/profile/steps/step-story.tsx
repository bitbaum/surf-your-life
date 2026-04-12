"use client"
import { useTranslations } from "next-intl"
import type { FormState } from "../profile-form"

const textareaClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"

export function StepStory({
  form,
  onChange,
}: {
  form: FormState
  onChange: <K extends keyof FormState>(key: K, val: FormState[K]) => void
}) {
  const t = useTranslations("portal.profile")

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("situationLabel")}</label>
        <textarea
          value={form.currentSituation}
          onChange={(e) => onChange("currentSituation", e.target.value)}
          rows={5}
          placeholder={t("situationPlaceholder")}
          className={textareaClass}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("goalsLabel")}</label>
        <textarea
          value={form.goals}
          onChange={(e) => onChange("goals", e.target.value)}
          rows={5}
          placeholder={t("goalsPlaceholder")}
          className={textareaClass}
        />
      </div>
    </div>
  )
}
