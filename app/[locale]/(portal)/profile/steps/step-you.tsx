"use client";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { WORK_HOURS_WEEK_MAX } from "@/lib/constants";
import type { FormState } from "../profile-form.helpers";

function getMonthNames(locale: string) {
  return Array.from({ length: 12 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2000, i, 1)),
  );
}

export function StepYou({
  form,
  onChange,
  updateDob,
}: {
  form: FormState;
  onChange: <K extends keyof FormState>(key: K, val: FormState[K]) => void;
  updateDob: (field: "dobDay" | "dobMonth" | "dobYear", val: string) => void;
}) {
  const t = useTranslations("portal.profile");
  const locale = useLocale();
  const monthNames = getMonthNames(locale);

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

      <Select
        label={t("genderLabel")}
        value={form.gender}
        onChange={(e) => onChange("gender", e.target.value)}
      >
        <option value="">—</option>
        <option value="male">{t("genderMale")}</option>
        <option value="female">{t("genderFemale")}</option>
        <option value="other">{t("genderOther")}</option>
        <option value="prefer_not">{t("genderPreferNot")}</option>
      </Select>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">
          {t("dateOfBirth")}
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Select value={form.dobDay} onChange={(e) => updateDob("dobDay", e.target.value)}>
            <option value="">{t("dobDay")}</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d).padStart(2, "0")}>
                {d}
              </option>
            ))}
          </Select>
          <Select value={form.dobMonth} onChange={(e) => updateDob("dobMonth", e.target.value)}>
            <option value="">{t("dobMonth")}</option>
            {monthNames.map((name, i) => (
              <option key={i} value={String(i + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={form.dobYear} onChange={(e) => updateDob("dobYear", e.target.value)}>
            <option value="">{t("dobYear")}</option>
            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 15 - i).map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </Select>
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
          max={WORK_HOURS_WEEK_MAX}
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
  );
}
