import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, max, or, isNull, lt } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { SEVEN_DAYS_MS, DAY_MS } from "@/lib/constants"

export default async function AtRiskClientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const nowMs = Date.now() // eslint-disable-line react-hooks/purity -- server component
  const sevenDaysAgo = new Date(nowMs - SEVEN_DAYS_MS)

  const atRisk = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      lastCheckIn: max(checkIns.createdAt),
    })
    .from(users)
    .leftJoin(checkIns, eq(checkIns.userId, users.id))
    .where(eq(users.role, CLIENT_ROLE))
    .groupBy(users.id, users.name, users.email, users.createdAt)
    .having(
      or(
        isNull(max(checkIns.createdAt)),
        lt(max(checkIns.createdAt), sevenDaysAgo)
      )
    )

  function daysSince(date: Date | null): string {
    if (!date) return "—"
    const days = Math.floor((nowMs - date.getTime()) / DAY_MS)
    return t("atRisk.daysSince", { n: days })
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
            <p className="text-slate-400 text-sm py-8 text-center">
              {t("atRisk.noAtRisk")}
            </p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-medium text-slate-500">{t("columnName")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("columnEmail")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("atRisk.lastCheckIn")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("columnJoined")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {atRisk.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 font-medium text-slate-800">{client.name ?? "—"}</td>
                    <td className="py-3 text-slate-600">{client.email}</td>
                    <td className="py-3 text-slate-500">
                      {client.lastCheckIn ? formatDate(client.lastCheckIn) : t("atRisk.never")}
                    </td>
                    <td className="py-3 text-slate-400">{daysSince(client.lastCheckIn)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-teal-600 hover:underline text-xs font-medium"
                        >
                          {t("viewLink")}
                        </Link>
                        <a
                          href={`mailto:${client.email}`}
                          className="text-xs text-slate-500 hover:text-teal-600 transition-colors"
                        >
                          {t("atRisk.sendMessage")}
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
