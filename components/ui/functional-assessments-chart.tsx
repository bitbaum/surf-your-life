"use client"

import { useState, useRef } from "react"
import { formatDate } from "@/lib/utils"
import {
  CHART_W, CHART_H, CHART_PAD, CHART_PLOT_H,
  toPath, toX, findClosestIndex, computeDateIndices, tooltipTransform,
} from "@/lib/chart-utils"

interface DataPoint {
  assessedAt: Date
  overallCapacity: number
  cognitiveCapacity: number | null
  physicalCapacity: number | null
  emotionalCapacity: number | null
  socialCapacity: number | null
}

export interface FunctionalAssessmentsChartLabels {
  overall: string
  cognitive: string
  physical: string
  emotional: string
  social: string
}

interface SeriesDef {
  key: keyof DataPoint
  label: string
  color: string
}

const OVERALL_COLOR = "#14b8a6"

function toY(v: number): number {
  return CHART_PAD.top + (1 - v / 10) * CHART_PLOT_H
}

interface Props {
  data: DataPoint[]
  labels: FunctionalAssessmentsChartLabels
}

export function FunctionalAssessmentsChart({ data, labels }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (data.length < 2) return null

  const n = data.length
  const bottom = CHART_PAD.top + CHART_PLOT_H

  const overallPts: [number, number][] = data.map((d, i) => [toX(i, n), toY(d.overallCapacity)])

  const allSubSeries: SeriesDef[] = [
    { key: "cognitiveCapacity", label: labels.cognitive, color: "#60a5fa" },
    { key: "physicalCapacity",  label: labels.physical,  color: "#a78bfa" },
    { key: "emotionalCapacity", label: labels.emotional, color: "#fb923c" },
    { key: "socialCapacity",    label: labels.social,    color: "#f472b6" },
  ]
  const activeSubSeries = allSubSeries.filter((s) => data.some((d) => d[s.key] != null))

  const subPts = activeSubSeries.map((s) =>
    data.map((d, i): [number, number] => [toX(i, n), d[s.key] != null ? toY(d[s.key] as number) : toY(5)])
  )

  const overallAreaPath = `${toPath(overallPts)} L ${overallPts[n - 1][0].toFixed(1)} ${bottom} L ${overallPts[0][0].toFixed(1)} ${bottom} Z`
  const dateIndices = computeDateIndices(n)

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = ((e.clientX - rect.left) / rect.width) * CHART_W
    setHovered(findClosestIndex(overallPts, mx))
  }

  const h = hovered
  const ci = h !== null ? data[h] : null

  return (
    <div className="relative select-none">
      <div className="flex flex-wrap items-center gap-4 mb-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="inline-block w-4 h-0.5 rounded-full bg-teal-500" />
          {labels.overall}
        </span>
        {activeSubSeries.map((s) => (
          <span key={s.key as string} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-4 h-px rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
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
          <linearGradient id="syl-fa-overall-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={OVERALL_COLOR} stopOpacity="0.2" />
            <stop offset="100%" stopColor={OVERALL_COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[2.5, 5, 7.5, 10].map((v) => (
          <line key={v} x1={CHART_PAD.left} y1={toY(v)} x2={CHART_W - CHART_PAD.right} y2={toY(v)} stroke="#f1f5f9" strokeWidth="1" />
        ))}

        {h !== null && (
          <line x1={overallPts[h][0]} y1={CHART_PAD.top} x2={overallPts[h][0]} y2={bottom} stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 3" />
        )}

        <path d={overallAreaPath} fill="url(#syl-fa-overall-grad)" />

        {activeSubSeries.map((s, si) => (
          <path key={s.key as string} d={toPath(subPts[si])} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />
        ))}

        <path d={toPath(overallPts)} fill="none" stroke={OVERALL_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {overallPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={h === i ? 5 : 3} fill="white" stroke={OVERALL_COLOR} strokeWidth={h === i ? 2 : 1.5} className="transition-all" />
        ))}

        {dateIndices.map((i) => (
          <text key={i} x={overallPts[i][0]} y={CHART_H - 6} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize="11" fill="#94a3b8">
            {formatDate(data[i].assessedAt)}
          </text>
        ))}
      </svg>

      {ci !== null && h !== null && (
        <div className="absolute pointer-events-none z-10" style={{ left: `${(overallPts[h][0] / CHART_W) * 100}%`, top: "32px", transform: tooltipTransform(h, n) }}>
          <div className="bg-slate-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl min-w-[130px]">
            <p className="text-slate-400 mb-1.5 font-medium">{formatDate(ci.assessedAt)}</p>
            <p className="text-teal-400 font-medium mb-1">{labels.overall}: <span className="text-white">{ci.overallCapacity}/10</span></p>
            {activeSubSeries.map((s) => ci[s.key] != null && (
              <p key={s.key as string} style={{ color: s.color }} className="mb-0.5">
                {s.label}: <span className="text-white">{ci[s.key] as number}/10</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
