"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SLEEP_HOURS, SLEEP_QUALITY_OPTIONS, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants"

interface Props {
  sleep: string
  setSleep: (v: string) => void
  sleepQuality: number | null
  setSleepQuality: (v: number | null) => void
}

export function SleepCard({ sleep, setSleep, sleepQuality, setSleepQuality }: Props) {
  const t = useTranslations("portal.checkIn")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("sleepCard")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">
              {t("sleepHours")} <span className="text-slate-400 font-normal">{t("sleepOptional")}</span>
            </label>
            <input
              type="number"
              min={SLEEP_HOURS.min}
              max={SLEEP_HOURS.max}
              value={sleep}
              onChange={(e) => setSleep(e.target.value)}
              placeholder={t("sleepHoursPlaceholder")}
              className="h-10 w-24 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">
            {t("sleepQuality")} <span className="text-slate-400 font-normal">{t("sleepOptional")}</span>
          </label>
          <div className="flex gap-2">
            {SLEEP_QUALITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSleepQuality(sleepQuality === opt.value ? null : opt.value)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 flex-1 transition-all ${
                  sleepQuality === opt.value
                    ? CHIP_SELECTED
                    : CHIP_UNSELECTED
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-[10px] text-slate-500 text-center leading-tight">
                  {t(opt.labelKey as Parameters<typeof t>[0])}
                </span>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
