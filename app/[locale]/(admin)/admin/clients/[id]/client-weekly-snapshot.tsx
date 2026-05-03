import { getTranslations } from "next-intl/server"
import type { checkIns } from "@/lib/db/schema"
import { localDateString, buildLastNDayStrings } from "@/lib/utils"
import { SEVEN_DAYS_MS, DASHBOARD_INSIGHT_ENERGY_WINDOW } from "@/lib/constants"
import { computeWeekDelta, computeInsight, isComparativeInsight } from "@/lib/domain/check-in"
import { InsightBanner } from "@/components/ui/insight-banner"
import { TrendCard } from "@/components/ui/trend-card"
import { DayCadenceSparkline } from "@/components/ui/day-cadence-sparkline"

type CheckIn = typeof checkIns.$inferSelect

export async function ClientWeeklySnapshot({ clientCheckIns }: { clientCheckIns: CheckIn[] }) {
  const t = await getTranslations("admin.clients")

  const weekDelta = computeWeekDelta(clientCheckIns)
  const sparkDays = buildLastNDayStrings(7)
  const sparkCheckedIn = new Set(clientCheckIns.map((ci) => localDateString(new Date(ci.createdAt))))
  const sparkPemDays = new Set(
    clientCheckIns.filter((ci) => ci.pemFlag === true).map((ci) => localDateString(new Date(ci.createdAt)))
  )
  const sparkCount = sparkDays.filter((d) => sparkCheckedIn.has(d)).length

  const sevenDaysAgoMs = Date.now() - SEVEN_DAYS_MS // eslint-disable-line react-hooks/purity -- server component
  const weekCheckInCount = clientCheckIns.filter((ci) => ci.createdAt.getTime() >= sevenDaysAgoMs).length
  const insightHit = computeInsight(
    clientCheckIns.slice(0, DASHBOARD_INSIGHT_ENERGY_WINDOW).map((ci) => ci.energyLevel),
    weekCheckInCount,
    weekDelta
  )
  const adminInsight =
    insightHit && isComparativeInsight(insightHit)
      ? "delta" in insightHit
        ? t(`detail.insights.${insightHit.key}`, { delta: insightHit.delta.toFixed(1) })
        : "count" in insightHit
          ? t(`detail.insights.${insightHit.key}`, { count: insightHit.count })
          : t(`detail.insights.${insightHit.key}`)
      : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium text-slate-700">{t("detail.cadence.title")}</span>
        <DayCadenceSparkline
          days={sparkDays}
          checkedIn={sparkCheckedIn}
          pemDays={sparkPemDays}
          hint={t("cadenceHint")}
          dayLabels={{ missed: t("dotMissed"), checkedIn: t("dotCheckedIn"), pem: t("dotPem") }}
          size="md"
        />
        <span className="text-xs text-slate-500">{t("detail.cadence.daysOfSeven", { count: sparkCount })}</span>
      </div>
      {adminInsight && <InsightBanner title={t("detail.insights.title")} body={adminInsight} />}
      {weekDelta.window.count > 0 && <TrendCard delta={weekDelta} namespace="admin.clients.detail.trend" />}
    </div>
  )
}
