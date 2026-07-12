import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, max, sql, count, desc, inArray } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { atRiskHaving } from "@/lib/db/at-risk"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { formatDate, daysSince, displayName } from "@/lib/utils"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { SEVEN_DAYS_MS, ADMIN_AT_RISK_MAX, MOOD_EMOJI, CLIENT_ENERGY_LOW_THRESHOLD, CLIENT_ENERGY_MODERATE_THRESHOLD } from "@/lib/constants"
import { NewThreadButton } from "../[id]/new-thread-button"
import { EmptyState } from "@/components/ui/empty-state"

export default async function AtRiskClientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS) // eslint-disable-line react-hooks/purity -- server component

  const atRisk = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      lastCheckIn: max(checkIns.createdAt),
      // Total check-ins distinguishes "long-time client gone silent" (high
      // count) from "new client never engaged" (zero) at a glance.
      totalCheckIns: count(checkIns.id),
    })
    .from(users)
    .leftJoin(checkIns, eq(checkIns.userId, users.id))
    .where(eq(users.role, CLIENT_ROLE))
    .groupBy(users.id, users.name, users.email, users.createdAt)
    .having(atRiskHaving(sevenDaysAgo))
    .orderBy(sql`max(${checkIns.createdAt}) ASC NULLS FIRST`)
    .limit(ADMIN_AT_RISK_MAX)

  // Fetch last check-in energy + mood for each at-risk client in one query.
  const clientIds = atRisk.map((c) => c.id)
  const lastCheckInDetails = clientIds.length > 0
    ? await db
        .selectDistinctOn([checkIns.userId], {
          userId: checkIns.userId,
          energyLevel: checkIns.energyLevel,
          mood: checkIns.mood,
        })
        .from(checkIns)
        .where(inArray(checkIns.userId, clientIds))
        .orderBy(checkIns.userId, desc(checkIns.createdAt))
    : []

  const lastDetails = Object.fromEntries(lastCheckInDetails.map((r) => [r.userId, r]))

  function formatDaysSince(date: Date | null): string {
    const days = daysSince(date)
    return days == null ? "—" : t("atRisk.daysSince", { n: days })
  }

  function nudgeBody(name: string | null, email: string, days: number | null): string {
    const who = displayName(name, email)
    return days != null
      ? t("atRisk.nudgeBodyWithDays", { name: who, days })
      : t("atRisk.nudgeBodyNever", { name: who })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t("atRisk.title")}
        description={t("atRisk.description")}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("atRisk.title")} ({atRisk.length})</CardTitle>
            <Link href="/admin/clients" className="text-sm text-teal-600 hover:underline">
              {t("detail.backLink")}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {atRisk.length === 0 ? (
            <div className="py-8">
              <EmptyState
                message={t("atRisk.noAtRisk")}
                action={<Link href="/admin/clients" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">{t("detail.backLink")}</Link>}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-medium text-slate-500">{t("columnName")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("columnEmail")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("atRisk.lastCheckIn")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("atRisk.inactiveFor")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("atRisk.totalCheckIns")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("atRisk.lastEnergy")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("atRisk.lastMood")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {atRisk.map((client) => {
                  const days = daysSince(client.lastCheckIn)
                  const detail = lastDetails[client.id]
                  const energy = detail?.energyLevel ?? null
                  const energyColor = energy == null ? "text-slate-300"
                    : energy <= CLIENT_ENERGY_LOW_THRESHOLD ? "text-red-600 font-semibold"
                    : energy <= CLIENT_ENERGY_MODERATE_THRESHOLD ? "text-amber-600"
                    : "text-teal-600"
                  return (
                    <tr
                      key={client.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 font-medium text-slate-800">
                        <Link href={`/admin/clients/${client.id}`} className="hover:text-teal-700 transition-colors">
                          {client.name ?? "—"}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-600">{client.email}</td>
                      <td className="py-3 text-slate-500">
                        {client.lastCheckIn ? formatDate(client.lastCheckIn) : t("atRisk.never")}
                      </td>
                      <td className="py-3 text-slate-400">{formatDaysSince(client.lastCheckIn)}</td>
                      <td className="py-3 text-slate-500">
                        {client.totalCheckIns > 0
                          ? client.totalCheckIns
                          : <span className="text-slate-300">0</span>}
                      </td>
                      <td className={`py-3 text-sm ${energyColor}`}>
                        {energy != null ? `${energy}/10` : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3 text-base">
                        {detail?.mood ? MOOD_EMOJI[detail.mood] ?? "—" : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="text-teal-600 hover:underline text-xs font-medium"
                          >
                            {t("viewLink")}
                          </Link>
                          <NewThreadButton
                            clientId={client.id}
                            label={t("atRisk.nudgeButton")}
                            modalTitle={t("atRisk.nudgeModalTitle")}
                            defaultSubject={t("atRisk.nudgeSubject")}
                            defaultBody={nudgeBody(client.name, client.email, days)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
