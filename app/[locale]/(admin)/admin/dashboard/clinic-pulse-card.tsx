import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { roundOne } from "@/lib/utils"
import { PulseSparkline } from "./pulse-sparkline"

export type PulseDay = {
  day: string
  avgEnergy: number
  avgMood: number
  activeClients: number
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
