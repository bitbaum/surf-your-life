import { getTranslations } from "next-intl/server"
import type { computeWeekDelta } from "@/lib/domain/check-in"
import { buildLastNDayStrings, localDateString } from "@/lib/utils"
import { DayCadenceSparkline } from "@/components/ui/day-cadence-sparkline"
import { TrendCard } from "@/components/ui/trend-card"

type SparkCheckIn = { createdAt: Date; pemFlag: boolean | null }

type Props = {
  recentCheckIns: SparkCheckIn[]
  weekDelta: ReturnType<typeof computeWeekDelta>
}

export async function DashboardSparklineRow({ recentCheckIns, weekDelta }: Props) {
  const t = await getTranslations("portal.dashboard")

  const sparkDays = buildLastNDayStrings(7)
  const sparkCheckedIn = new Set(recentCheckIns.map((ci) => localDateString(new Date(ci.createdAt))))
  const sparkPemDays = new Set(
    recentCheckIns.filter((ci) => ci.pemFlag === true).map((ci) => localDateString(new Date(ci.createdAt)))
  )
  const sparkCount = sparkDays.filter((d) => sparkCheckedIn.has(d)).length

  return (
    <>
      {sparkCount > 0 && (
        <div className="mb-6 flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-700">{t("thisWeek")}</span>
          <DayCadenceSparkline
            days={sparkDays}
            checkedIn={sparkCheckedIn}
            pemDays={sparkPemDays}
            hint={t("cadenceHint")}
            dayLabels={{ missed: t("dotMissed"), checkedIn: t("dotCheckedIn"), pem: t("dotPem") }}
            size="md"
          />
          <span className="text-xs text-slate-500">{t("daysOfSeven", { count: sparkCount })}</span>
        </div>
      )}
      {weekDelta.window.count > 0 && (
        <div className="mb-6">
          <TrendCard delta={weekDelta} namespace="portal.dashboard.trend" />
        </div>
      )}
    </>
  )
}
