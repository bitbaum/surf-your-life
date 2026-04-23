"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ACTIVITY_LEVELS, PEM_SEVERITY_SCALE, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants"

interface Props {
  activityLevel: string | null
  setActivityLevel: (v: string) => void
  pemFlag: boolean
  setPemFlag: (v: boolean) => void
  pemSeverity: number
  setPemSeverity: (v: number) => void
}

export function ActivityPemCard({
  activityLevel, setActivityLevel,
  pemFlag, setPemFlag,
  pemSeverity, setPemSeverity,
}: Props) {
  const t = useTranslations("portal.checkIn")
  const showPem = activityLevel === "moderate" || activityLevel === "active"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activityCard")}</CardTitle>
        <CardDescription>{t("activityDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => {
                setActivityLevel(level.value)
                if (level.value === "rest" || level.value === "light") setPemFlag(false)
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                activityLevel === level.value
                  ? CHIP_SELECTED
                  : CHIP_UNSELECTED
              }`}
            >
              <span className="text-2xl">{level.emoji}</span>
              <span className="text-xs text-slate-600">{t(level.labelKey as Parameters<typeof t>[0])}</span>
            </button>
          ))}
        </div>

        {showPem && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-1">{t("pemCard")}</p>
            <p className="text-xs text-slate-400 mb-3">{t("pemDescription")}</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pemFlag}
                onChange={(e) => setPemFlag(e.target.checked)}
                className="w-4 h-4 accent-teal-600"
              />
              <span className="text-sm text-slate-700">{t("pemLabel")}</span>
            </label>
            {pemFlag && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">{t("pemSeverityLabel")}</label>
                  <span className="text-sm font-bold text-red-600">{pemSeverity}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 w-4">{PEM_SEVERITY_SCALE.min}</span>
                  <input
                    type="range"
                    min={PEM_SEVERITY_SCALE.min}
                    max={PEM_SEVERITY_SCALE.max}
                    value={pemSeverity}
                    onChange={(e) => setPemSeverity(parseInt(e.target.value))}
                    className="flex-1 accent-red-500"
                  />
                  <span className="text-xs text-slate-400 w-4">{PEM_SEVERITY_SCALE.max}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{t("pemHint")}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
