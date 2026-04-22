import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { WellnessTrendChart } from "./wellness-trend-chart"
import { SleepChart } from "./sleep-chart"
import { SymptomsChart } from "./symptoms-chart"

type TrendPoint = {
  createdAt: Date
  mood: string
  energyLevel: number
  sleepHours: number | null
  symptomFatigue: number | null
  symptomBrainFog: number | null
  symptomPain: number | null
  stressLevel: number | null
}

interface Props {
  trendCheckIns: TrendPoint[]
  hasSymptomData: boolean
  insight: string | null
  hasRecentCheckIns: boolean
}

export async function DashboardCharts({ trendCheckIns, hasSymptomData, insight, hasRecentCheckIns }: Props) {
  const t = await getTranslations("portal.dashboard")

  return (
    <>
      {trendCheckIns.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("wellnessTrend")}</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">{t("wellnessTrendSubtitle")}</p>
              </div>
              <Link href="/check-ins" className="text-sm text-teal-600 hover:underline shrink-0">
                {t("viewAll")}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <WellnessTrendChart data={trendCheckIns} />
          </CardContent>
        </Card>
      )}

      {trendCheckIns.filter((c) => c.sleepHours != null).length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("sleepTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SleepChart data={trendCheckIns} />
            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              <span>{formatDate(trendCheckIns[0].createdAt)}</span>
              <span>{formatDate(trendCheckIns[trendCheckIns.length - 1].createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSymptomData && trendCheckIns.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("symptomsTitle")}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">{t("symptomsSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <SymptomsChart data={trendCheckIns} />
          </CardContent>
        </Card>
      )}

      {insight && (
        <Card className="mb-6 bg-teal-50 border-teal-200">
          <CardContent className="pt-5 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-medium text-teal-900">{t("insightTitle")}</p>
              <p className="text-sm text-teal-700 mt-0.5">{insight}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasRecentCheckIns && (
        <div className="flex justify-center">
          <Link href="/check-ins" className="text-sm text-slate-400 hover:text-teal-600 transition-colors">
            {t("viewAll")}
          </Link>
        </div>
      )}
    </>
  )
}
