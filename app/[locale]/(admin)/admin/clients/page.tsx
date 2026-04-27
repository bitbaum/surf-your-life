import { db } from "@/lib/db"
import { users, checkIns, profiles, clientAlerts } from "@/lib/db/schema"
import { eq, desc, count, or, ilike, and, max, inArray, sql } from "drizzle-orm"
import { fetchCadenceMap, type CadenceMap } from "@/lib/db/check-in-cadence"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { computeTotalPages, parsePage, computeOffset, buildLastNDayStrings, daysSince } from "@/lib/utils"
import { PAGINATION_DEFAULT, SEVEN_DAYS_MS } from "@/lib/constants"
import { ClientSearch } from "./client-search"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Pagination } from "@/components/ui/pagination"
import { ClientTableRow } from "./client-table-row"

type SortOption = "joined" | "checkin_desc" | "most_checkins" | "needs_attention"
const SORT_OPTIONS: SortOption[] = ["joined", "checkin_desc", "most_checkins", "needs_attention"]
function isValidSort(v: string | undefined): v is SortOption {
  return SORT_OPTIONS.includes(v as SortOption)
}

export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const { page: pageParam, q, sort: sortParam } = await searchParams
  const sort: SortOption = isValidSort(sortParam) ? sortParam : "joined"
  const page = parsePage(pageParam)
  const offset = computeOffset(page, PAGINATION_DEFAULT)

  const searchFilter = q?.trim()
    ? or(
        ilike(users.name, `%${q.trim()}%`),
        ilike(users.email, `%${q.trim()}%`)
      )
    : undefined

  const roleFilter = eq(users.role, CLIENT_ROLE)
  const staleCutoff = new Date(Date.now() - SEVEN_DAYS_MS)

  // "Needs attention" = stale 7+ days (or never checked in) OR has any unresolved alert.
  // EXISTS subqueries keep the main groupBy clean and the count query identical.
  const needsAttentionFilter = sort === "needs_attention"
    ? sql`(
        NOT EXISTS (
          SELECT 1 FROM ${checkIns}
          WHERE ${checkIns.userId} = ${users.id}
            AND ${checkIns.createdAt} >= ${staleCutoff}
        )
        OR EXISTS (
          SELECT 1 FROM ${clientAlerts}
          WHERE ${clientAlerts.clientId} = ${users.id}
            AND ${clientAlerts.isResolved} = false
        )
      )`
    : undefined

  const whereParts = [roleFilter, searchFilter, needsAttentionFilter].filter(
    (p): p is NonNullable<typeof p> => p != null
  )
  const whereClause = whereParts.length > 1 ? and(...whereParts) : whereParts[0]

  const [clients, totalResult] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        mainConcern: profiles.mainConcern,
        lastCheckIn: max(checkIns.createdAt),
        checkInCount: count(checkIns.id),
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(checkIns, eq(checkIns.userId, users.id))
      .where(whereClause)
      .groupBy(users.id, users.name, users.email, users.createdAt, profiles.mainConcern)
      .orderBy(
        sort === "checkin_desc"
          ? sql`max(${checkIns.createdAt}) DESC NULLS LAST`
          : sort === "most_checkins"
            ? sql`count(${checkIns.id}) DESC`
            : sort === "needs_attention"
              ? sql`max(${checkIns.createdAt}) ASC NULLS FIRST`
              : desc(users.createdAt)
      )
      .limit(PAGINATION_DEFAULT)
      .offset(offset),
    db.select({ count: count() }).from(users).where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  const clientIds = clients.map((c) => c.id)
  const alertCountMap = new Map<string, { count: number; hasHigh: boolean }>()
  let cadenceMap: CadenceMap = {}
  if (clientIds.length > 0) {
    const [alertCountRows, fetchedCadence] = await Promise.all([
      db
        .select({
          clientId: clientAlerts.clientId,
          alertCount: count(),
          hasHigh: sql<boolean>`bool_or(${clientAlerts.severity} = 'high')`,
        })
        .from(clientAlerts)
        .where(and(eq(clientAlerts.isResolved, false), inArray(clientAlerts.clientId, clientIds)))
        .groupBy(clientAlerts.clientId),
      fetchCadenceMap(clientIds, staleCutoff),
    ])
    cadenceMap = fetchedCadence
    for (const r of alertCountRows) alertCountMap.set(r.clientId, { count: r.alertCount, hasHigh: r.hasHigh })
  }

  const sparkDays = buildLastNDayStrings(7)
  const sparkDayLabels = {
    missed: t("dotMissed"),
    checkedIn: t("dotCheckedIn"),
    pem: t("dotPem"),
  }

  function pageLink(p: number) {
    const params = new URLSearchParams()
    params.set("page", String(p))
    if (q?.trim()) params.set("q", q.trim())
    if (sort !== "joined") params.set("sort", sort)
    return `/admin/clients?${params.toString()}`
  }

  function sortLink(s: SortOption) {
    const params = new URLSearchParams()
    if (q?.trim()) params.set("q", q.trim())
    if (s !== "joined") params.set("sort", s)
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
          <FilterTabs
            tabs={[
              { value: "joined" as SortOption, label: t("sortJoined") },
              { value: "checkin_desc" as SortOption, label: t("sortCheckInDesc") },
              { value: "most_checkins" as SortOption, label: t("sortMostCheckIns") },
              { value: "needs_attention" as SortOption, label: t("sortNeedsAttention") },
            ]}
            active={sort}
            href={sortLink}
          />
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">{t("columnName")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnEmail")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnConcern")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnLastCheckIn")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnCheckIns")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnJoined")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const isStale = client.lastCheckIn == null || client.lastCheckIn < staleCutoff
                const days = daysSince(client.lastCheckIn)
                const nudgeBody = isStale
                  ? days != null
                    ? t("atRisk.nudgeBodyWithDays", {
                        name: client.name ?? client.email.split("@")[0],
                        days,
                      })
                    : t("atRisk.nudgeBodyNever", {
                        name: client.name ?? client.email.split("@")[0],
                      })
                  : null
                return (
                  <ClientTableRow
                    key={client.id}
                    client={client}
                    alert={alertCountMap.get(client.id)}
                    isStale={isStale}
                    staleHint={t("staleHint")}
                    viewLabel={t("viewLink")}
                    sparkDays={sparkDays}
                    sparkCheckedIn={new Set(cadenceMap[client.id]?.checkedIn ?? [])}
                    sparkPemDays={new Set(cadenceMap[client.id]?.pemDays ?? [])}
                    sparkHint={t("cadenceHint")}
                    sparkDayLabels={sparkDayLabels}
                    nudge={isStale && nudgeBody
                      ? {
                          label: t("atRisk.nudgeButton"),
                          modalTitle: t("atRisk.nudgeModalTitle"),
                          subject: t("atRisk.nudgeSubject"),
                          body: nudgeBody,
                        }
                      : null
                    }
                  />
                )
              })}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <p>
                      {q
                        ? t("noResults")
                        : sort === "needs_attention"
                          ? t("noNeedsAttention")
                          : t("noClients")}
                    </p>
                    {q && (
                      <Link href="/admin/clients" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors mt-2 inline-block">{t("clearSearch")}</Link>
                    )}
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
