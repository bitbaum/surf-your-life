"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { formatDate } from "@/lib/utils"
import { SLEEP_CHART_MAX_HOURS } from "@/lib/constants"

interface DataPoint {
  createdAt: Date
  sleepHours: number | null
}

interface Props {
  data: DataPoint[]
}

export function SleepChart({ data }: Props) {
  const t = useTranslations("portal.checkIns")
  const [tooltip, setTooltip] = useState<{ index: number } | null>(null)

  const filtered = data.filter((d) => d.sleepHours != null)

  if (filtered.length < 2) return null

  return (
    <div className="flex items-end gap-1.5 h-16 relative">
      {filtered.map((ci, i) => {
        const hours = Math.min(ci.sleepHours!, SLEEP_CHART_MAX_HOURS)
        const pct = (hours / SLEEP_CHART_MAX_HOURS) * 100
        const isHovered = tooltip?.index === i

        return (
          <div
            key={i}
            className="flex-1 relative group"
            onMouseEnter={() => setTooltip({ index: i })}
            onMouseLeave={() => setTooltip(null)}
          >
            <div
              className={`w-full rounded-t bg-blue-400 transition-all ${isHovered ? "opacity-80" : ""}`}
              style={{ height: `${Math.max(pct, 8)}%` }}
            />
            {isHovered && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                {t("sleepHoursTooltip", { n: ci.sleepHours! })}
                <br />
                {formatDate(ci.createdAt)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
