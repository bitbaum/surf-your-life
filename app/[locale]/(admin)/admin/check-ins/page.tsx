import { db } from "@/lib/db"
import { checkIns, users, profiles, type MainConcern } from "@/lib/db/schema"
import { eq, and, or, ilike, desc, count, sql } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { PageHeader } from "@/components/ui/page-header"
import { computeTotalPages, parsePagination } from "@/lib/utils"
import { PAGINATION_DEFAULT, CLINIC_TZ, MAIN_CONCERNS } from "@/lib/constants"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { CheckInsCard, type FilterMode } from "./check-ins-card"

const FILTER_MODES: FilterMode[] = ["all", "pem", "today"]
function isValidFilter(v: string | undefined): v is FilterMode {
  return FILTER_MODES.includes(v as FilterMode)
}

// Timezone-correct "today" predicate — matches check-ins whose local Zürich
// calendar date equals today's Zürich date, regardless of UTC offset / DST.
const todayInClinicTz = sql`(${checkIns.createdAt} AT TIME ZONE ${CLINIC_TZ})::date = (NOW() AT TIME ZONE ${CLINIC_TZ})::date`

function isValidConcern(v: string | undefined): v is MainConcern {
  return MAIN_CONCERNS.includes(v as MainConcern)
}

export default async function AdminCheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; filter?: string; q?: string; concern?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.checkIns")

  const { page: pageParam, filter: filterParam, q, concern: concernParam } = await searchParams
  const filter: FilterMode = isValidFilter(filterParam) ? filterParam : "all"
  const concern: MainConcern | undefined = isValidConcern(concernParam) ? concernParam : undefined
  const { page, offset } = parsePagination(pageParam)

  const searchFilter = q?.trim()
    ? or(
        ilike(users.name, `%${q.trim()}%`),
        ilike(users.email, `%${q.trim()}%`)
      )
    : undefined

  // EXISTS subquery avoids a profiles JOIN in the main GROUP-BY queries
  const concernFilter = concern
    ? sql`EXISTS (SELECT 1 FROM ${profiles} WHERE ${profiles.userId} = ${users.id} AND ${profiles.mainConcern} = ${concern})`
    : undefined

  const roleFilter = eq(users.role, CLIENT_ROLE)
  const pemFilter = filter === "pem" ? eq(checkIns.pemFlag, true) : undefined
  const dayFilter = filter === "today" ? todayInClinicTz : undefined
  const whereParts = [roleFilter, searchFilter, pemFilter, dayFilter, concernFilter].filter(
    (p): p is NonNullable<typeof p> => p != null
  )
  const whereClause = whereParts.length > 1 ? and(...whereParts) : whereParts[0]

  // Today count for badge — always computed so the tab reflects reality
  // regardless of which filter is active.
  const todayWhereParts = [roleFilter, searchFilter, todayInClinicTz, concernFilter].filter(
    (p): p is NonNullable<typeof p> => p != null
  )
  const todayWhereClause = todayWhereParts.length > 1 ? and(...todayWhereParts) : todayWhereParts[0]

  const [rows, totalResult, todayCountResult] = await Promise.all([
    db
      .select({
        id: checkIns.id,
        createdAt: checkIns.createdAt,
        mood: checkIns.mood,
        energyLevel: checkIns.energyLevel,
        sleepHours: checkIns.sleepHours,
        pemFlag: checkIns.pemFlag,
        pemSeverity: checkIns.pemSeverity,
        clientId: users.id,
        clientName: users.name,
        clientEmail: users.email,
      })
      .from(checkIns)
      .innerJoin(users, eq(users.id, checkIns.userId))
      .where(whereClause)
      .orderBy(desc(checkIns.createdAt))
      .limit(PAGINATION_DEFAULT)
      .offset(offset),
    db
      .select({ count: count() })
      .from(checkIns)
      .innerJoin(users, eq(users.id, checkIns.userId))
      .where(whereClause),
    db
      .select({ count: count() })
      .from(checkIns)
      .innerJoin(users, eq(users.id, checkIns.userId))
      .where(todayWhereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const todayCount = todayCountResult[0]?.count ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  function filterHref(v: FilterMode) {
    const ps = new URLSearchParams()
    if (v !== "all") ps.set("filter", v)
    if (q?.trim()) ps.set("q", q.trim())
    if (concern) ps.set("concern", concern)
    const qs = ps.toString()
    return qs ? `/admin/check-ins?${qs}` : "/admin/check-ins"
  }
  function concernHref(c: MainConcern | "") {
    const ps = new URLSearchParams()
    if (filter !== "all") ps.set("filter", filter)
    if (q?.trim()) ps.set("q", q.trim())
    if (c) ps.set("concern", c)
    const qs = ps.toString()
    return qs ? `/admin/check-ins?${qs}` : "/admin/check-ins"
  }
  function pageHref(p: number) {
    const ps = new URLSearchParams()
    if (filter !== "all") ps.set("filter", filter)
    if (q?.trim()) ps.set("q", q.trim())
    if (concern) ps.set("concern", concern)
    ps.set("page", String(p))
    return `/admin/check-ins?${ps.toString()}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />
      <CheckInsCard
        rows={rows}
        filter={filter}
        todayCount={todayCount}
        concern={concern}
        q={q}
        page={page}
        totalPages={totalPages}
        filterHref={filterHref}
        concernHref={concernHref}
        pageHref={pageHref}
      />
    </div>
  )
}
