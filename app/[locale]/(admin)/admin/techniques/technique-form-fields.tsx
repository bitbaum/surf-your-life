"use client"

import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
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

  return (
    <>
      <Input label={`${t("fieldName")} *`} {...field("name")} required maxLength={TECHNIQUE_NAME_MAX} />

      <div className="grid grid-cols-2 gap-3">
        <Select label={`${t("fieldCategory")} *`} {...field("category")} required>
          {TECHNIQUE_CATEGORIES.map(({ value, emoji }) => (
            <option key={value} value={value}>{emoji} {t(`category.${value}`)}</option>
          ))}
        </Select>
        <Select label={`${t("fieldDifficulty")} *`} {...field("difficulty")} required>
          {TECHNIQUE_DIFFICULTIES.map(({ value }) => (
            <option key={value} value={value}>{t(`difficulty.${value}`)}</option>
          ))}
        </Select>
      </div>

      <Textarea label={t("fieldDescription")} {...field("description")} rows={2} maxLength={FIELD_MAX_NOTES} />

      <Textarea label={t("fieldInstructions")} {...field("instructions")} rows={4} maxLength={FIELD_MAX_LONG} placeholder={t("instructionsPlaceholder")} />

      <div className="grid grid-cols-2 gap-3">
        <Input label={t("fieldDuration")} type="number" min={TECHNIQUE_DURATION_MINUTES.min} max={TECHNIQUE_DURATION_MINUTES.max} placeholder="10" {...field("durationMinutes")} />
        <Input label={t("fieldResourceUrl")} type="url" {...field("resourceUrl")} placeholder={t("fieldResourceUrlPlaceholder")} />
      </div>
    </>
  )
}
