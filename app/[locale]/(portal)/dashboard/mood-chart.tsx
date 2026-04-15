"use client"

import { useState } from "react"
import { formatDate } from "@/lib/utils"
import { MOOD_LABEL, MOOD_NUMERIC } from "@/lib/constants"

const MOOD_COLORS: Record<string, string> = {
  very_low: "bg-red-300",
  low: "bg-orange-300",
  neutral: "bg-slate-300",
  good: "bg-teal-300",
  excellent: "bg-teal-500",
}

interface DataPoint {
  createdAt: Date
  mood: string
}

interface Props {
  data: DataPoint[]
}

export function MoodChart({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ index: number } | null>(null)

  return (
    <div className="flex items-end gap-1.5 h-16 relative">
      {data.map((ci, i) => {
        const value = MOOD_NUMERIC[ci.mood] ?? 0.5
        const pct = value * 100
        const colorClass = MOOD_COLORS[ci.mood] ?? "bg-slate-300"
        const isHovered = tooltip?.index === i

        return (
          <div
            key={i}
            className="flex-1 relative group"
            onMouseEnter={() => setTooltip({ index: i })}
            onMouseLeave={() => setTooltip(null)}
          >
            <div
              className={`w-full rounded-t transition-all ${colorClass} ${isHovered ? "opacity-80" : ""}`}
              style={{ height: `${Math.max(pct, 8)}%` }}
            />
            {isHovered && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                {MOOD_LABEL[ci.mood] ?? ci.mood}
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
