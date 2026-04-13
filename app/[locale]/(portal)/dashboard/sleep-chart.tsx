"use client"

import { useState } from "react"
import { formatDate } from "@/lib/utils"

const MAX_DISPLAY_HOURS = 10

interface DataPoint {
  createdAt: Date
  sleepHours: number | null
}

interface Props {
  data: DataPoint[]
}

export function SleepChart({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ index: number } | null>(null)

  // Only show entries that have sleep data
  const filtered = data.filter((d) => d.sleepHours != null)

  if (filtered.length < 2) return null

  return (
    <div className="flex items-end gap-1.5 h-16 relative">
      {filtered.map((ci, i) => {
        const hours = Math.min(ci.sleepHours!, MAX_DISPLAY_HOURS)
        const pct = (hours / MAX_DISPLAY_HOURS) * 100
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
                {ci.sleepHours}h sleep
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
