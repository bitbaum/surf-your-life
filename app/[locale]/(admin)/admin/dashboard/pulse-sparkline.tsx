import { toPath } from "@/lib/chart-utils"
import type { PulseDay } from "./clinic-pulse-card"

const SPARK_W = 400
const SPARK_H = 52
const SPARK_PAD = { top: 4, right: 0, bottom: 4, left: 0 }
const SPARK_PLOT_H = SPARK_H - SPARK_PAD.top - SPARK_PAD.bottom

export function PulseSparkline({ data }: { data: PulseDay[] }) {
  if (data.length < 2) return null
  const n = data.length
  const xFor = (i: number) =>
    SPARK_PAD.left + (i / (n - 1)) * (SPARK_W - SPARK_PAD.left - SPARK_PAD.right)

  const energyPts: [number, number][] = data.map((d, i) => [
    xFor(i),
    SPARK_PAD.top + (1 - d.avgEnergy / 10) * SPARK_PLOT_H,
  ])
  const moodPts: [number, number][] = data.map((d, i) => [
    xFor(i),
    SPARK_PAD.top + (1 - (d.avgMood - 1) / 4) * SPARK_PLOT_H,
  ])

  const energyPath = toPath(energyPts)
  const first = energyPts[0]
  const last = energyPts[n - 1]
  const areaPath = `${energyPath} L ${last[0].toFixed(1)} ${SPARK_H} L ${first[0].toFixed(1)} ${SPARK_H} Z`

  return (
    <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} className="w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="pulse-energy-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#pulse-energy-grad)" />
      <path d={energyPath} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(moodPts)} fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />
    </svg>
  )
}
