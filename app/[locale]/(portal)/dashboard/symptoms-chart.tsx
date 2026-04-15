"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { formatDate } from "@/lib/utils"
import {
  CHART_W,
  CHART_H,
  CHART_PAD,
  CHART_TOOLTIP_RIGHT_THRESHOLD,
  CHART_TOOLTIP_LEFT_THRESHOLD,
} from "@/lib/constants"

interface DataPoint {
  createdAt: Date
  symptomFatigue: number | null
  symptomBrainFog: number | null
  symptomPain: number | null
  stressLevel: number | null
}

interface Props {
  data: DataPoint[]
}

const PLOT_W = CHART_W - CHART_PAD.left - CHART_PAD.right
const PLOT_H = CHART_H - CHART_PAD.top - CHART_PAD.bottom

// Each symptom line: color, data key, i18n label key
const SYMPTOM_LINES = [
  { key: "symptomFatigue" as const, stroke: "#f59e0b", gradId: "syl-fatigue-grad" },
  { key: "symptomBrainFog" as const, stroke: "#8b5cf6", gradId: "syl-brainfog-grad" },
  { key: "symptomPain" as const, stroke: "#f43f5e", gradId: "syl-pain-grad" },
  { key: "stressLevel" as const, stroke: "#64748b", gradId: "syl-stress-grad" },
] as const

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

export function SymptomsChart({ data }: Props) {
  const t = useTranslations("portal.dashboard")
  const [hovered, setHovered] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (data.length < 2) return null

  const n = data.length
  const bottom = CHART_PAD.top + PLOT_H

  // Build point arrays for each symptom line (only lines with data)
  const lines = SYMPTOM_LINES.map((line) => {
    const pts: [number, number][] = data.map((d, i) => {
      const val = d[line.key]
      return [
        CHART_PAD.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W),
        CHART_PAD.top + (1 - (val ?? 0) / 10) * PLOT_H,
      ]
    })
    // Only include if at least 2 non-null values exist
    const hasData = data.filter((d) => d[line.key] != null).length >= 2
    return { ...line, pts, hasData }
  }).filter((l) => l.hasData)

  if (lines.length === 0) return null

  // Use the first active line's x-positions for interaction
  const xPts = lines[0].pts

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = ((e.clientX - rect.left) / rect.width) * CHART_W
    let closest = 0
    let minDist = Infinity
    xPts.forEach(([x], i) => {
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

  const labelKeys = {
    symptomFatigue: "chartFatigue",
    symptomBrainFog: "chartBrainFog",
    symptomPain: "chartPain",
    stressLevel: "chartStress",
  } as const

  return (
    <div className="relative select-none">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-3">
        {lines.map((line) => (
          <span key={line.key} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className="inline-block w-4 h-0.5 rounded-full"
              style={{ backgroundColor: line.stroke }}
            />
            {t(labelKeys[line.key])}
          </span>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          {lines.map((line) => (
            <linearGradient key={line.gradId} id={line.gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line.stroke} stopOpacity="0.15" />
              <stop offset="100%" stopColor={line.stroke} stopOpacity="0" />
            </linearGradient>
          ))}
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
            x1={xPts[h][0]} y1={CHART_PAD.top}
            x2={xPts[h][0]} y2={bottom}
            stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 3"
          />
        )}

        {/* Area fills + lines + dots per symptom */}
        {lines.map((line) => {
          const linePath = toPath(line.pts)
          const areaPath = `${linePath} L ${line.pts[n - 1][0].toFixed(1)} ${bottom} L ${line.pts[0][0].toFixed(1)} ${bottom} Z`
          return (
            <g key={line.key}>
              <path d={areaPath} fill={`url(#${line.gradId})`} />
              <path d={linePath} fill="none" stroke={line.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {line.pts.map(([x, y], i) => (
                <circle
                  key={i} cx={x} cy={y}
                  r={h === i ? 5 : 3}
                  fill="white" stroke={line.stroke} strokeWidth={h === i ? 2 : 1.5}
                  className="transition-all"
                />
              ))}
            </g>
          )
        })}

        {/* X-axis date labels */}
        {dateIndices.map((i) => (
          <text
            key={i}
            x={xPts[i][0]}
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
            left: `${(xPts[h][0] / CHART_W) * 100}%`,
            top: "32px",
            transform:
              h > n * CHART_TOOLTIP_RIGHT_THRESHOLD
                ? "translateX(calc(-100% - 8px))"
                : h < n * CHART_TOOLTIP_LEFT_THRESHOLD
                  ? "translateX(8px)"
                  : "translateX(-50%)",
          }}
        >
          <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl min-w-[130px]">
            <p className="text-slate-400 mb-1.5 font-medium">{formatDate(ci.createdAt)}</p>
            {lines.map((line) => {
              const val = ci[line.key]
              if (val == null) return null
              return (
                <p key={line.key} className="flex items-center justify-between gap-3 mb-0.5 last:mb-0">
                  <span style={{ color: line.stroke }} className="font-medium">
                    {t(labelKeys[line.key])}
                  </span>
                  <span>{val}/10</span>
                </p>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
