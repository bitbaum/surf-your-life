"use client"

import { useState } from "react"
import { formatDate } from "@/lib/utils"

interface DataPoint {
  createdAt: Date
  energyLevel: number
  mood: string
  pemFlag: boolean | null
}

interface Props {
  data: DataPoint[]
}

// Show oldest → newest (left to right)
export function EnergyMiniChart({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ index: number } | null>(null)
  const sorted = [...data].reverse()

  return (
    <div className="flex items-end gap-1 h-12 relative">
      {sorted.map((ci, i) => {
        const pct = (ci.energyLevel / 10) * 100
        const isHovered = tooltip?.index === i
        const barColor = ci.pemFlag
          ? "bg-red-400"
          : ci.energyLevel >= 7
          ? "bg-teal-400"
          : ci.energyLevel >= 4
          ? "bg-amber-300"
          : "bg-slate-300"

        return (
          <div
            key={i}
            className="flex-1 relative"
            onMouseEnter={() => setTooltip({ index: i })}
            onMouseLeave={() => setTooltip(null)}
          >
            <div
              className={`w-full rounded-t transition-all ${barColor} ${isHovered ? "opacity-70" : ""}`}
              style={{ height: `${Math.max(pct, 6)}%` }}
            />
            {isHovered && (
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                Energy {ci.energyLevel}/10{ci.pemFlag ? " · PEM" : ""}
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
