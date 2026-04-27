import { db } from "@/lib/db"
import { users, checkIns, profiles, clientAlerts } from "@/lib/db/schema"
import { eq, desc, count, or, ilike, and, max, inArray, sql } from "drizzle-orm"
import { fetchCadenceMap } from "@/lib/db/check-in-cadence"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { computeTotalPages, parsePagination } from "@/lib/utils"
import { PAGINATION_DEFAULT, SEVEN_DAYS_MS } from "@/lib/constants"
import { ClientSearch } from "./client-search"
import { ClientsCard } from "./clients-card"
import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"

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
  const { page, offset } = parsePagination(pageParam)

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
  let cadenceMap = {}
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

      <ClientsCard
        clients={clients}
        alertCountMap={alertCountMap}
        cadenceMap={cadenceMap}
        staleCutoff={staleCutoff}
        q={q}
        sort={sort}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
