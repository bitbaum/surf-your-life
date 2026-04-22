"use client"

import { useTranslations } from "next-intl"
import { ACTIVITY_LEVELS } from "@/lib/constants"

interface Props {
  activityLevel: string | null
  setActivityLevel: (v: string | null) => void
  pemFlag: boolean
  setPemFlag: (v: boolean) => void
  pemSeverity: number
  setPemSeverity: (v: number) => void
}

export function EditActivityPemSection({
  activityLevel, setActivityLevel,
  pemFlag, setPemFlag,
  pemSeverity, setPemSeverity,
}: Props) {
  const t = useTranslations("portal.checkIns")
  const tCheckIn = useTranslations("portal.checkIn")

  return (
    <>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          {t("editActivityLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {ACTIVITY_LEVELS.map((lvl) => (
            <button
              key={lvl.value}
              type="button"
              onClick={() => setActivityLevel(activityLevel === lvl.value ? null : lvl.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all min-w-[56px] ${
                activityLevel === lvl.value ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-lg">{lvl.emoji}</span>
              <span className="text-xs text-slate-600">{tCheckIn(lvl.labelKey as Parameters<typeof tCheckIn>[0])}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{t("editPemLabel")}</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={pemFlag}
            onChange={(e) => setPemFlag(e.target.checked)}
            className="rounded border-slate-300 accent-teal-600"
          />
          <span className="text-sm text-slate-700">{t("editPemFlagLabel")}</span>
        </label>
        {pemFlag && (
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-1">{t("editPemSeverityLabel")}: {pemSeverity}/10</p>
            <input
              type="range"
              min={1}
              max={10}
              value={pemSeverity}
              onChange={(e) => setPemSeverity(parseInt(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>
        )}
      </div>
    </>
  )
}
