import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { roundOne } from "@/lib/utils"
import { toPath } from "@/lib/chart-utils"

export type PulseDay = {
  day: string
  avgEnergy: number
  avgMood: number
  activeClients: number
}

const SPARK_W = 400
const SPARK_H = 52
const SPARK_PAD = { top: 4, right: 0, bottom: 4, left: 0 }
const SPARK_PLOT_H = SPARK_H - SPARK_PAD.top - SPARK_PAD.bottom

// energy: 0–10 scale. mood: 1–5 → normalized to 0–1 for identical y-axis.
function PulseSparkline({ data }: { data: PulseDay[] }) {
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

function deltaLabel(d: number | null): string | null {
  if (d == null) return null
  return d > 0 ? `+${d}` : String(d)
}
function deltaColor(d: number | null): string {
  if (d == null) return "text-slate-400"
  if (d > 0) return "text-teal-600"
  if (d < 0) return "text-red-500"
  return "text-slate-400"
}

interface Props {
  data: PulseDay[]
}

export async function ClinicPulseCard({ data }: Props) {
  const t = await getTranslations("admin.dashboard.clinicPulse")

  if (data.length < 3) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <Activity className="w-4 h-4 text-teal-600" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">{t("noData")}</p>
        </CardContent>
      </Card>
    )
  }

  const recent7 = data.slice(-7)
  const prior7 = data.slice(-14, -7)

  const avg7Energy = recent7.length > 0
    ? roundOne(recent7.reduce((s, d) => s + d.avgEnergy, 0) / recent7.length)
    : null
  const prev7Energy = prior7.length > 0
    ? roundOne(prior7.reduce((s, d) => s + d.avgEnergy, 0) / prior7.length)
    : null
  const energyDelta = avg7Energy != null && prev7Energy != null ? roundOne(avg7Energy - prev7Energy) : null

  const avg7Mood = recent7.length > 0
    ? roundOne(recent7.reduce((s, d) => s + d.avgMood, 0) / recent7.length)
    : null
  const prev7Mood = prior7.length > 0
    ? roundOne(prior7.reduce((s, d) => s + d.avgMood, 0) / prior7.length)
    : null
  const moodDelta = avg7Mood != null && prev7Mood != null ? roundOne(avg7Mood - prev7Mood) : null

  const avgDailyClients = roundOne(data.reduce((s, d) => s + d.activeClients, 0) / data.length)

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-700">
          <Activity className="w-4 h-4 text-teal-600" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6 mb-3">
          <div>
            <p className="text-xs text-slate-400">{t("avgEnergy7d")}</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">
              {avg7Energy ?? "—"}<span className="text-sm font-normal text-slate-400">/10</span>
            </p>
            {deltaLabel(energyDelta) && (
              <p className={`text-xs mt-0.5 ${deltaColor(energyDelta)}`}>
                {t("vsLast7d", { delta: deltaLabel(energyDelta)! })}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("avgMood7d")}</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">
              {avg7Mood ?? "—"}<span className="text-sm font-normal text-slate-400">/5</span>
            </p>
            {deltaLabel(moodDelta) && (
              <p className={`text-xs mt-0.5 ${deltaColor(moodDelta)}`}>
                {t("vsLast7d", { delta: deltaLabel(moodDelta)! })}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("dailyClients")}</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">{avgDailyClients}</p>
          </div>
        </div>
        <PulseSparkline data={data} />
        <div className="flex items-center gap-4 mt-1.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-6 h-0.5 bg-teal-500 rounded" />
            {t("legendEnergy")}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-6 border-t border-dashed border-violet-500" />
            {t("legendMood")}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
