import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, profiles } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { ClipboardList, TrendingUp } from "lucide-react"
import { ONBOARDING_REQUIRED_FIELDS, PROFILE_COMPLETION_FIELDS, ENERGY_SCALE } from "@/lib/constants"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.dashboard")

  const [profile, recentCheckIns] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, session.user.id),
      orderBy: [desc(checkIns.createdAt)],
      limit: 7,
    }),
  ])

  const isOnboarded = ONBOARDING_REQUIRED_FIELDS.every(
    (f) => profile?.[f as keyof typeof profile]
  )

  const completedFields = PROFILE_COMPLETION_FIELDS.filter(
    (f) => profile?.[f as keyof typeof profile]
  ).length
  const completionPct = Math.round((completedFields / PROFILE_COMPLETION_FIELDS.length) * 100)

  // Chronological order for sparkline
  const trend = [...recentCheckIns].reverse()

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("title", { name: session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "" })}
        description={t("subtitle")}
      />

      {!isOnboarded && (
        <div className="mb-6 rounded-xl bg-teal-50 border border-teal-200 p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="font-medium text-teal-900 text-sm">{t("completeProfile")}</p>
              <p className="text-xs text-teal-700 mt-0.5">
                {t("completeProfileBody", { pct: completionPct })}
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm">{t("completeProfileCta")}</Button>
            </Link>
          </div>
          <div className="h-1.5 rounded-full bg-teal-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label={t("totalCheckIns")} value={recentCheckIns.length} icon={ClipboardList} color="teal" />
        <StatCard
          label={t("lastEnergy")}
          value={recentCheckIns[0] ? `${recentCheckIns[0].energyLevel}/10` : "—"}
          icon={TrendingUp}
          color="blue"
        />
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">{t("readyTitle")}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t("readySubtitle")}</p>
          </div>
          <Link href="/check-in">
            <Button size="sm">{t("checkIn")}</Button>
          </Link>
        </div>
      </div>

      {trend.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("energyTrend")}</CardTitle>
              <Link href="/check-ins" className="text-sm text-teal-600 hover:underline">
                {t("viewAll")}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-16">
              {trend.map((ci) => {
                const pct = ((ci.energyLevel - ENERGY_SCALE.min) / (ENERGY_SCALE.max - ENERGY_SCALE.min)) * 100
                return (
                  <div
                    key={ci.id}
                    className="flex-1"
                    title={`Energy ${ci.energyLevel}/10 — ${formatDate(ci.createdAt)}`}
                  >
                    <div
                      className="w-full rounded-t bg-teal-500 transition-all"
                      style={{ height: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              <span>{formatDate(trend[0].createdAt)}</span>
              <span>{formatDate(trend[trend.length - 1].createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("recentCheckIns")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-slate-100">
              {recentCheckIns.slice(0, 5).map((ci) => (
                <div key={ci.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{formatEnumValue(ci.mood)}</p>
                    <p className="text-xs text-slate-400">{formatDate(ci.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{t("energy")}</span>
                    <span className="text-sm font-semibold text-teal-700">{ci.energyLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
