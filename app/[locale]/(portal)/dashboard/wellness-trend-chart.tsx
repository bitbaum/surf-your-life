"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { formatDate } from "@/lib/utils"
import {
  MOOD_LABEL,
  MOOD_EMOJI,
  MOOD_NUMERIC,
  CHART_W,
  CHART_H,
  CHART_PAD,
  CHART_TOOLTIP_RIGHT_THRESHOLD,
  CHART_TOOLTIP_LEFT_THRESHOLD,
} from "@/lib/constants"

interface DataPoint {
  createdAt: Date
  mood: string
  energyLevel: number
}

interface Props {
  data: DataPoint[]
}

const PLOT_W = CHART_W - CHART_PAD.left - CHART_PAD.right
const PLOT_H = CHART_H - CHART_PAD.top - CHART_PAD.bottom

function toPath(pts: [number, number][]): string {
  if (pts.length < 2) return ""
  const d = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`]
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const cpx = ((x0 + x1) / 2).toFixed(1)
    d.push(`C ${cpx} ${y0.toFixed(1)}, ${cpx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`)
  }
  return d.join(" ")
}

export function WellnessTrendChart({ data }: Props) {
  const t = useTranslations("portal.dashboard")
  const [hovered, setHovered] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (data.length < 2) return null

  const n = data.length

  const moodPts: [number, number][] = data.map((d, i) => [
    CHART_PAD.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
    CHART_PAD.top + (1 - (MOOD_NUMERIC[d.mood] ?? 0.5)) * PLOT_H,
  ])
  const energyPts: [number, number][] = data.map((d, i) => [
    CHART_PAD.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
    CHART_PAD.top + (1 - d.energyLevel / 10) * PLOT_H,
  ])

  const moodLinePath = toPath(moodPts)
  const energyLinePath = toPath(energyPts)
  const bottom = CHART_PAD.top + PLOT_H
  const moodAreaPath = `${moodLinePath} L ${moodPts[n - 1][0].toFixed(1)} ${bottom} L ${moodPts[0][0].toFixed(1)} ${bottom} Z`
  const energyAreaPath = `${energyLinePath} L ${energyPts[n - 1][0].toFixed(1)} ${bottom} L ${energyPts[0][0].toFixed(1)} ${bottom} Z`

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = ((e.clientX - rect.left) / rect.width) * CHART_W
    let closest = 0
    let minDist = Infinity
    moodPts.forEach(([x], i) => {
      const dist = Math.abs(x - mx)
      if (dist < minDist) { minDist = dist; closest = i }
    })
    setHovered(closest)
  }

  const h = hovered
  const ci = h !== null ? data[h] : null

  const dateIndices = n <= 3
    ? data.map((_, i) => i)
    : [0, Math.floor((n - 1) / 2), n - 1]

  return (
    <div className="relative select-none">
      <div className="flex items-center gap-5 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-4 h-0.5 rounded-full bg-teal-500" />
          {t("chartMood")}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-4 h-0.5 rounded-full bg-violet-400" />
          {t("chartEnergy")}
        </span>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="syl-mood-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="syl-energy-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75, 1].map((v) => (
          <line
            key={v}
            x1={CHART_PAD.left} y1={CHART_PAD.top + (1 - v) * PLOT_H}
            x2={CHART_W - CHART_PAD.right} y2={CHART_PAD.top + (1 - v) * PLOT_H}
            stroke="#f1f5f9" strokeWidth="1"
          />
        ))}

        {/* Hover crosshair */}
        {h !== null && (
          <line
            x1={moodPts[h][0]} y1={CHART_PAD.top}
            x2={moodPts[h][0]} y2={bottom}
            stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 3"
          />
        )}

        {/* Area fills */}
        <path d={energyAreaPath} fill="url(#syl-energy-grad)" />
        <path d={moodAreaPath} fill="url(#syl-mood-grad)" />

        {/* Lines */}
        <path d={energyLinePath} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={moodLinePath} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots — energy */}
        {energyPts.map(([x, y], i) => (
          <circle
            key={`e-${i}`} cx={x} cy={y}
            r={h === i ? 5 : 3}
            fill="white" stroke="#a78bfa" strokeWidth={h === i ? 2 : 1.5}
            className="transition-all"
          />
        ))}

        {/* Dots — mood */}
        {moodPts.map(([x, y], i) => (
          <circle
            key={`m-${i}`} cx={x} cy={y}
            r={h === i ? 5 : 3}
            fill="white" stroke="#14b8a6" strokeWidth={h === i ? 2 : 1.5}
            className="transition-all"
          />
        ))}

        {/* X-axis date labels */}
        {dateIndices.map((i) => (
          <text
            key={i}
            x={moodPts[i][0]}
            y={CHART_H - 6}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            fontSize="11" fill="#94a3b8"
          >
            {formatDate(data[i].createdAt)}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {ci !== null && h !== null && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            left: `${(moodPts[h][0] / CHART_W) * 100}%`,
            top: "32px",
            transform:
              h > n * CHART_TOOLTIP_RIGHT_THRESHOLD
                ? "translateX(calc(-100% - 8px))"
                : h < n * CHART_TOOLTIP_LEFT_THRESHOLD
                  ? "translateX(8px)"
                  : "translateX(-50%)",
          }}
        >
          <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl min-w-[120px]">
            <p className="text-slate-400 mb-1.5 font-medium">{formatDate(ci.createdAt)}</p>
            <p className="flex items-center gap-1.5 mb-1">
              <span className="text-teal-400 font-medium">{t("chartMood")}</span>
              <span>{MOOD_EMOJI[ci.mood]} {MOOD_LABEL[ci.mood]}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-violet-300 font-medium">{t("chartEnergy")}</span>
              <span>{ci.energyLevel}/10</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
