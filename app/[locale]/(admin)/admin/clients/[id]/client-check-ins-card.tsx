import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { CheckInRow } from "./check-in-row"
import { EnergyMiniChart } from "./energy-mini-chart"
import { getTranslations } from "next-intl/server"
import { roundOne, formatDate } from "@/lib/utils"
import type { checkIns } from "@/lib/db/schema"
import type { InferSelectModel } from "drizzle-orm"

type CheckIn = InferSelectModel<typeof checkIns>

interface ClientCheckInsCardProps {
  clientId: string
  checkIns: CheckIn[]
  totalCheckIns: number
}

export async function ClientCheckInsCard({ clientId, checkIns, totalCheckIns }: ClientCheckInsCardProps) {
  const t = await getTranslations("admin.clients")

  // Compute summary stats from already-fetched rows — no extra queries
  const pemCount = checkIns.filter((ci) => ci.pemFlag).length
  const avgEnergy = checkIns.length > 0
    ? roundOne(checkIns.reduce((s, ci) => s + ci.energyLevel, 0) / checkIns.length)
    : null
  const lastCheckIn = checkIns[0]?.createdAt ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>
            {t("detail.checkInsCard")} ({totalCheckIns})
            {totalCheckIns > PAGINATION_DEFAULT && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {t("detail.showingRecent", { n: PAGINATION_DEFAULT })}
              </span>
            )}
          </span>
          {totalCheckIns > PAGINATION_DEFAULT && (
            <Link
              href={`/admin/clients/${clientId}/check-ins`}
              className="text-xs font-normal text-teal-600 hover:underline"
            >
              {t("detail.viewAllCheckIns")}
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checkIns.length > 0 ? (
          <>
            {/* Quick-glance clinical stats */}
            <div className="flex gap-4 mb-4 p-3 bg-slate-50 rounded-lg text-xs">
              {avgEnergy != null && (
                <div>
                  <p className="text-slate-400">{t("detail.avgEnergy")}</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{avgEnergy}/10</p>
                </div>
              )}
              <div>
                <p className="text-slate-400">{t("detail.pemEpisodes")}</p>
                <p className={`font-semibold mt-0.5 ${pemCount > 0 ? "text-red-600" : "text-slate-700"}`}>
                  {pemCount}
                </p>
              </div>
              {lastCheckIn && (
                <div>
                  <p className="text-slate-400">{t("detail.lastCheckIn")}</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{formatDate(lastCheckIn)}</p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-1.5">{t("detail.energyTrend")}</p>
              <EnergyMiniChart data={checkIns.map((ci) => ({
                createdAt: ci.createdAt,
                energyLevel: ci.energyLevel,
                mood: ci.mood,
                pemFlag: ci.pemFlag,
              }))} />
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              {checkIns.map((ci) => (
                <CheckInRow key={ci.id} ci={ci} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-sm">{t("detail.noCheckIns")}</p>
        )}
      </CardContent>
    </Card>
  )
}
