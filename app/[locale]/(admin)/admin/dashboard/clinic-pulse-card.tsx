import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { roundOne } from "@/lib/utils"
import { toPath } from "@/lib/chart-utils"

export type PulseDay = {
  day: string
  avgEnergy: number
  activeClients: number
}

const SPARK_W = 400
const SPARK_H = 52
const SPARK_PAD = { top: 4, right: 0, bottom: 4, left: 0 }
const SPARK_PLOT_H = SPARK_H - SPARK_PAD.top - SPARK_PAD.bottom

function EnergySparkline({ data }: { data: PulseDay[] }) {
  if (data.length < 2) return null
  const n = data.length
  const pts: [number, number][] = data.map((d, i) => [
    SPARK_PAD.left + (i / (n - 1)) * (SPARK_W - SPARK_PAD.left - SPARK_PAD.right),
    SPARK_PAD.top + (1 - d.avgEnergy / 10) * SPARK_PLOT_H,
  ])
  const linePath = toPath(pts)
  const [first] = pts
  const last = pts[n - 1]
  const areaPath = `${linePath} L ${last[0].toFixed(1)} ${SPARK_H} L ${first[0].toFixed(1)} ${SPARK_H} Z`

  return (
    <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} className="w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="pulse-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#pulse-grad)" />
      <path d={linePath} fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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

  // 7-day vs prior-7-day avg energy delta
  const recent7 = data.slice(-7)
  const prior7 = data.slice(-14, -7)
  const avg7 = recent7.length > 0
    ? roundOne(recent7.reduce((s, d) => s + d.avgEnergy, 0) / recent7.length)
    : null
  const avgPrev7 = prior7.length > 0
    ? roundOne(prior7.reduce((s, d) => s + d.avgEnergy, 0) / prior7.length)
    : null
  const delta = avg7 != null && avgPrev7 != null ? roundOne(avg7 - avgPrev7) : null

  const avgDailyClients = roundOne(data.reduce((s, d) => s + d.activeClients, 0) / data.length)

  const deltaLabel = delta == null ? null
    : delta > 0 ? `+${delta}`
    : String(delta)
  const deltaColor = delta == null ? "text-slate-400"
    : delta > 0 ? "text-teal-600"
    : delta < 0 ? "text-red-500"
    : "text-slate-400"

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
              {avg7 ?? "—"}<span className="text-sm font-normal text-slate-400">/10</span>
            </p>
            {deltaLabel && (
              <p className={`text-xs mt-0.5 ${deltaColor}`}>
                {t("vsLast7d", { delta: deltaLabel })}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("dailyClients")}</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-0.5">{avgDailyClients}</p>
          </div>
        </div>
        <EnergySparkline data={data} />
      </CardContent>
    </Card>
  )
}
