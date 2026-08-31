"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  MAIN_CONCERNS,
  FIELD_MAX_TITLE,
  FIELD_MAX_LONG,
  PROGRAM_DURATION_WEEKS_MAX,
} from "@/lib/constants";

interface FormState {
  title: string;
  description: string;
  durationWeeks: string;
  targetConcern: string;
  isTemplate: boolean;
}

interface Props {
  form: FormState;
  onChange: (field: string, value: string | boolean) => void;
}

export function ProgramBasicFields({ form, onChange }: Props) {
  const t = useTranslations("admin.programs");
  const tConcerns = useTranslations("concerns");

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-title" className="text-sm font-medium text-slate-700">
          {t("fieldTitle")} *
        </label>
        <Input
          id="edit-title"
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          required
          maxLength={FIELD_MAX_TITLE}
        />
      </div>

      <Textarea
        id="edit-description"
        label={t("fieldDescription")}
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
        maxLength={FIELD_MAX_LONG}
        rows={3}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-duration" className="text-sm font-medium text-slate-700">
            {t("fieldDuration")}
          </label>
          <Input
            id="edit-duration"
            type="number"
            min={1}
            max={PROGRAM_DURATION_WEEKS_MAX}
            value={form.durationWeeks}
            onChange={(e) => onChange("durationWeeks", e.target.value)}
            placeholder={t("fieldDurationPlaceholder")}
          />
        </div>
        <Select
          id="edit-concern"
          label={t("fieldTargetConcern")}
          value={form.targetConcern}
          onChange={(e) => onChange("targetConcern", e.target.value)}
        >
          <option value="">{t("fieldTargetConcernAny")}</option>
          {MAIN_CONCERNS.map((c) => (
            <option key={c} value={c}>
              {tConcerns(c as Parameters<typeof tConcerns>[0])}
            </option>
          ))}
        </Select>
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
  );
}
