"use client"
import { useTranslations, useLocale } from "next-intl"
import { Input } from "@/components/ui/input"
import type { FormState } from "../profile-form"

function getMonthNames(locale: string) {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, i, 1))
  )
}

const selectClass =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"

export function StepYou({
  form,
  onChange,
  updateDob,
}: {
  form: FormState
  onChange: <K extends keyof FormState>(key: K, val: FormState[K]) => void
  updateDob: (field: "dobDay" | "dobMonth" | "dobYear", val: string) => void
}) {
  const t = useTranslations("portal.profile")
  const locale = useLocale()
  const monthNames = getMonthNames(locale)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Input
          label={t("nameLabel")}
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder={t("namePlaceholder")}
        />
        <p className="text-xs text-slate-400 mt-1">{t("namePrivacyNote")}</p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("genderLabel")}</label>
        <select value={form.gender} onChange={(e) => onChange("gender", e.target.value)} className={selectClass}>
          <option value="">—</option>
          <option value="male">{t("genderMale")}</option>
          <option value="female">{t("genderFemale")}</option>
          <option value="other">{t("genderOther")}</option>
          <option value="prefer_not">{t("genderPreferNot")}</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("dateOfBirth")}</label>
        <div className="grid grid-cols-3 gap-2">
          <select value={form.dobDay} onChange={(e) => updateDob("dobDay", e.target.value)} className={selectClass}>
            <option value="">{t("dobDay")}</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d).padStart(2, "0")}>
                {d}
              </option>
            ))}
          </select>
          <select value={form.dobMonth} onChange={(e) => updateDob("dobMonth", e.target.value)} className={selectClass}>
            <option value="">{t("dobMonth")}</option>
            {monthNames.map((name, i) => (
              <option key={i} value={String(i + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>
          <select value={form.dobYear} onChange={(e) => updateDob("dobYear", e.target.value)} className={selectClass}>
            <option value="">{t("dobYear")}</option>
            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 15 - i).map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label={t("occupation")}
        value={form.occupation}
        onChange={(e) => onChange("occupation", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("workHoursLabel")}
          type="number"
          min={0}
          max={168}
          value={form.workHoursPerWeek}
          onChange={(e) => onChange("workHoursPerWeek", e.target.value)}
          placeholder={t("workHoursPlaceholder")}
        />
        <Input
          label={t("insuranceLabel")}
          value={form.insuranceProvider}
          onChange={(e) => onChange("insuranceProvider", e.target.value)}
          placeholder={t("insurancePlaceholder")}
        />
      </div>
    </div>
  )
}
