import { db } from "@/lib/db"
import { users, checkIns, profiles, clientAlerts, threads, assignments } from "@/lib/db/schema"
import { eq, desc, count, or, ilike, and, max, inArray, sql } from "drizzle-orm"
import { fetchCadenceMap, fetchEnergyTrendMap } from "@/lib/db/check-in-cadence"
import { unreadFromClientExists } from "@/lib/db/thread-unread"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { computeTotalPages, parsePagination } from "@/lib/utils"
import { PAGINATION_DEFAULT, SEVEN_DAYS_MS, MAIN_CONCERNS } from "@/lib/constants"
import { ClientSearch } from "./client-search"
import { ClientsCard, type SortOption } from "./clients-card"
import { Suspense } from "react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import type { MainConcern } from "@/lib/db/schema"

const SORT_OPTIONS: SortOption[] = ["joined", "checkin_desc", "most_checkins", "needs_attention", "energy_declining"]
function isValidSort(v: string | undefined): v is SortOption {
  return SORT_OPTIONS.includes(v as SortOption)
}
function isValidConcern(v: string | undefined): v is MainConcern {
  return MAIN_CONCERNS.includes(v as MainConcern)
}

export default async function ClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; q?: string; sort?: string; concern?: string; practitioner?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const { page: pageParam, q, sort: sortParam, concern: concernParam, practitioner: practitionerParam } = await searchParams
  const sort: SortOption = isValidSort(sortParam) ? sortParam : "joined"
  const concern: MainConcern | undefined = isValidConcern(concernParam) ? concernParam : undefined
  const practitioner = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(practitionerParam ?? "") ? practitionerParam : undefined
  const { page, offset } = parsePagination(pageParam)

  const searchFilter = q?.trim()
    ? or(
        ilike(users.name, `%${q.trim()}%`),
        ilike(users.email, `%${q.trim()}%`)
      )
    : undefined

  const roleFilter = eq(users.role, CLIENT_ROLE)
  const staleCutoff = new Date(Date.now() - SEVEN_DAYS_MS)
  const fourteenDaysAgo = new Date(staleCutoff.getTime() - SEVEN_DAYS_MS)

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

  // EXISTS subquery keeps the count query profile-join-free.
  const concernFilter = concern
    ? sql`EXISTS (SELECT 1 FROM ${profiles} WHERE ${profiles.userId} = ${users.id} AND ${profiles.mainConcern} = ${concern})`
    : undefined

  const practitionerFilter = practitioner
    ? sql`EXISTS (SELECT 1 FROM ${assignments} WHERE ${assignments.clientId} = ${users.id} AND ${assignments.practitionerId}::text = ${practitioner} AND ${assignments.active} = true)`
    : undefined

  const whereParts = [roleFilter, searchFilter, needsAttentionFilter, concernFilter, practitionerFilter].filter(
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
              : sort === "energy_declining"
                ? sql`(
                    (SELECT ROUND(AVG(energy_level)::numeric, 1) FROM check_ins ci1
                     WHERE ci1.user_id = ${users.id} AND ci1.created_at >= ${staleCutoff})
                    -
                    (SELECT ROUND(AVG(energy_level)::numeric, 1) FROM check_ins ci2
                     WHERE ci2.user_id = ${users.id} AND ci2.created_at >= ${fourteenDaysAgo} AND ci2.created_at < ${staleCutoff})
                  ) ASC NULLS LAST`
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
  const unreadMessageMap = new Map<string, number>()
  let cadenceMap = {}
  let energyTrendMap = new Map<string, "up" | "down" | "stable">()
  if (clientIds.length > 0) {
    const [alertCountRows, fetchedCadence, unreadRows, fetchedEnergyTrend] = await Promise.all([
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
      db
        .select({ clientId: threads.clientId, unreadCount: count() })
        .from(threads)
        .where(and(inArray(threads.clientId, clientIds), unreadFromClientExists()))
        .groupBy(threads.clientId),
      fetchEnergyTrendMap(clientIds, staleCutoff),
    ])
    cadenceMap = fetchedCadence
    energyTrendMap = fetchedEnergyTrend
    for (const r of alertCountRows) alertCountMap.set(r.clientId, { count: r.alertCount, hasHigh: r.hasHigh })
    for (const r of unreadRows) unreadMessageMap.set(r.clientId, r.unreadCount)
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
        unreadMessageMap={unreadMessageMap}
        cadenceMap={cadenceMap}
        energyTrendMap={energyTrendMap}
        staleCutoff={staleCutoff}
        q={q}
        sort={sort}
        concern={concern}
        practitioner={practitioner}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
