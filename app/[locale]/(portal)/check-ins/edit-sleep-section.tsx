"use client"

import { useTranslations } from "next-intl"
import { SLEEP_HOURS, SLEEP_QUALITY_OPTIONS } from "@/lib/constants"

interface Props {
  sleep: string
  setSleep: (v: string) => void
  sleepQuality: number | null
  setSleepQuality: (v: number | null) => void
}

export function EditSleepSection({ sleep, setSleep, sleepQuality, setSleepQuality }: Props) {
  const t = useTranslations("portal.checkIns")
  const tCheckIn = useTranslations("portal.checkIn")

  return (
    <>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editSleepLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <input
          type="number"
          min={SLEEP_HOURS.min}
          max={SLEEP_HOURS.max}
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          placeholder={t("editSleepPlaceholder")}
          className="h-9 w-28 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          {t("editSleepQualityLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {SLEEP_QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSleepQuality(sleepQuality === opt.value ? null : opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all min-w-[52px] ${
                sleepQuality === opt.value ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-xs text-slate-600">{tCheckIn(opt.labelKey as Parameters<typeof tCheckIn>[0])}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
