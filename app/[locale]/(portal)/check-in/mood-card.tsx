"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MOODS, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants"

interface Props {
  value: string
  onChange: (mood: string) => void
}

export function MoodCard({ value, onChange }: Props) {
  const t = useTranslations("portal.checkIn")
  const labels: Record<string, string> = {
    very_low: t("moodVeryLow"),
    low: t("moodLow"),
    neutral: t("moodNeutral"),
    good: t("moodGood"),
    excellent: t("moodExcellent"),
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("mood")}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(m.value)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                value === m.value ? CHIP_SELECTED : CHIP_UNSELECTED
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs text-slate-600">{labels[m.value]}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
