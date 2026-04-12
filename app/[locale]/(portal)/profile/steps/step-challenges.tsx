"use client"
import { useTranslations } from "next-intl"
import { MAIN_CONCERNS } from "@/lib/constants"
import type { FormState } from "../profile-form"

export function StepChallenges({
  form,
  onToggle,
}: {
  form: FormState
  onToggle: (value: string) => void
}) {
  const t = useTranslations("portal.profile")

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">{t("concernsNote")}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MAIN_CONCERNS.map((opt) => {
          const selected = form.mainConcerns.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
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
    </div>
  )
}
