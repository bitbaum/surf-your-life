import { db } from "@/lib/db"
import { users, checkIns, profiles, clientAlerts } from "@/lib/db/schema"
import { eq, desc, count, or, ilike, and, max, inArray } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { ClientSearch } from "./client-search"
import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Pagination } from "@/components/ui/pagination"

export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const { page: pageParam, q } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT

  const searchFilter = q?.trim()
    ? or(
        ilike(users.name, `%${q.trim()}%`),
        ilike(users.email, `%${q.trim()}%`)
      )
    : undefined

  const roleFilter = eq(users.role, CLIENT_ROLE)
  const whereClause = searchFilter ? and(roleFilter, searchFilter) : roleFilter

  const [clients, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        mainConcern: profiles.mainConcern,
        lastCheckIn: max(checkIns.createdAt),
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(checkIns, eq(checkIns.userId, users.id))
      .where(whereClause)
      .groupBy(users.id, users.name, users.email, users.createdAt, profiles.mainConcern)
      .orderBy(desc(users.createdAt))
      .limit(PAGINATION_DEFAULT)
      .offset(offset),
    db.select({ count: count() }).from(users).where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / PAGINATION_DEFAULT)

  const clientIds = clients.map((c) => c.id)
  const alertCountMap = new Map<string, number>()
  if (clientIds.length > 0) {
    const alertCountRows = await db
      .select({ clientId: clientAlerts.clientId, alertCount: count() })
      .from(clientAlerts)
      .where(and(eq(clientAlerts.isResolved, false), inArray(clientAlerts.clientId, clientIds)))
      .groupBy(clientAlerts.clientId)
    for (const r of alertCountRows) alertCountMap.set(r.clientId, r.alertCount)
  }

  function pageLink(p: number) {
    const params = new URLSearchParams()
    params.set("page", String(p))
    if (q?.trim()) params.set("q", q.trim())
    return `/admin/clients?${params.toString()}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={`${total} ${t("title").toLowerCase()}`} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <Suspense>
            <ClientSearch defaultValue={q ?? ""} />
          </Suspense>
        </div>
        <Link
          href="/admin/clients/at-risk"
          className="text-sm text-red-500 hover:text-red-700 font-medium ml-4 flex-shrink-0"
        >
          {t("atRiskLink")}
        </Link>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("allClients")}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">{t("columnName")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnEmail")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnConcern")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnLastCheckIn")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnJoined")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      {client.name ?? "—"}
                      {(alertCountMap.get(client.id) ?? 0) > 0 && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full leading-none">
                          {alertCountMap.get(client.id)}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{client.email}</td>
                  <td className="py-3 text-slate-500">
                    {client.mainConcern ? formatEnumValue(client.mainConcern) : "—"}
                  </td>
                  <td className="py-3 text-slate-500">
                    {client.lastCheckIn ? formatDate(client.lastCheckIn) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-3 text-slate-400">{formatDate(client.createdAt)}</td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-teal-600 hover:underline text-xs font-medium"
                    >
                      {t("viewLink")}
                    </Link>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {q ? t("noResults") : t("noClients")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
        </CardContent>
      </Card>
    </div>
  )
}
