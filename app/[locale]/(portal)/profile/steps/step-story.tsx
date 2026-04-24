"use client"
import { useTranslations } from "next-intl"
import { Textarea } from "@/components/ui/textarea"
import type { FormState } from "../profile-form.helpers"

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
      <Textarea
        label={t("situationLabel")}
        value={form.currentSituation}
        onChange={(e) => onChange("currentSituation", e.target.value)}
        rows={5}
        placeholder={t("situationPlaceholder")}
      />
      <Textarea
        label={t("goalsLabel")}
        value={form.goals}
        onChange={(e) => onChange("goals", e.target.value)}
        rows={5}
        placeholder={t("goalsPlaceholder")}
      />
    </div>
  )
}
