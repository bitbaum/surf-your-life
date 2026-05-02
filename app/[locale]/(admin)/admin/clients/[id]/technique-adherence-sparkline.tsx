import type { DailyAdherencePoint } from "@/lib/domain/techniques"

const W = 120, H = 28, PAD = 2
const PLOT_W = W - PAD * 2
const PLOT_H = H - PAD * 2

export function TechniqueAdherenceSparkline({ trend }: { trend: DailyAdherencePoint[] }) {
  if (trend.length < 2) return null

  const toX = (i: number) => PAD + (i / (trend.length - 1)) * PLOT_W
  const toY = (pct: number) => PAD + (1 - pct / 100) * PLOT_H

  const linePath = trend
    .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(d.pct).toFixed(1)}`)
    .join(" ")
  const areaPath = `${linePath} L ${toX(trend.length - 1).toFixed(1)} ${H} L ${PAD} ${H} Z`

  const recent7avg = trend.slice(-7).reduce((s, d) => s + d.pct, 0) / 7
  const earlier7avg = trend.slice(0, 7).reduce((s, d) => s + d.pct, 0) / 7
  const isTrending = recent7avg >= earlier7avg + 8
  const isDeclining = recent7avg <= earlier7avg - 8
  const color = isDeclining ? "#dc2626" : isTrending ? "#0d9488" : "#64748b"

  return (
    <svg width={W} height={H} className="flex-shrink-0 opacity-80">
      <defs>
        <linearGradient id="ats-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#ats-fill)" />
      <path d={linePath} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
