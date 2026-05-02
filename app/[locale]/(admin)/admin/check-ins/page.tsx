import { db } from "@/lib/db"
import { checkIns, users } from "@/lib/db/schema"
import { eq, and, or, ilike, desc, count, sql } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { formatDate, computeTotalPages, parsePagination } from "@/lib/utils"
import { PAGINATION_DEFAULT, MOOD_EMOJI, MOODS, CLINIC_TZ } from "@/lib/constants"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Suspense } from "react"

type FilterMode = "all" | "pem" | "today"
const FILTER_MODES: FilterMode[] = ["all", "pem", "today"]
function isValidFilter(v: string | undefined): v is FilterMode {
  return FILTER_MODES.includes(v as FilterMode)
}

// Timezone-correct "today" predicate — matches check-ins whose local Zürich
// calendar date equals today's Zürich date, regardless of UTC offset / DST.
const todayInClinicTz = sql`(${checkIns.createdAt} AT TIME ZONE ${CLINIC_TZ})::date = (NOW() AT TIME ZONE ${CLINIC_TZ})::date`

export default async function AdminCheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.checkIns")
  const tCheckIn = await getTranslations("portal.checkIn")
  const moodMap = Object.fromEntries(MOODS.map((m) => [m.value, m]))

  const { page: pageParam, filter: filterParam, q } = await searchParams
  const filter: FilterMode = isValidFilter(filterParam) ? filterParam : "all"
  const { page, offset } = parsePagination(pageParam)

  const searchFilter = q?.trim()
    ? or(
        ilike(users.name, `%${q.trim()}%`),
        ilike(users.email, `%${q.trim()}%`)
      )
    : undefined

  const roleFilter = eq(users.role, CLIENT_ROLE)
  const pemFilter = filter === "pem" ? eq(checkIns.pemFlag, true) : undefined
  const dayFilter = filter === "today" ? todayInClinicTz : undefined
  const whereParts = [roleFilter, searchFilter, pemFilter, dayFilter].filter(
    (p): p is NonNullable<typeof p> => p != null
  )
  const whereClause = whereParts.length > 1 ? and(...whereParts) : whereParts[0]

  // Today count for badge — always computed so the tab reflects reality
  // regardless of which filter is active.
  const todayWhereParts = [roleFilter, searchFilter, todayInClinicTz].filter(
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
    const qs = ps.toString()
    return qs ? `/admin/check-ins?${qs}` : "/admin/check-ins"
  }
  function pageHref(p: number) {
    const ps = new URLSearchParams()
    if (filter !== "all") ps.set("filter", filter)
    if (q?.trim()) ps.set("q", q.trim())
    ps.set("page", String(p))
    return `/admin/check-ins?${ps.toString()}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <Card>
        <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <Suspense>
                <SearchInput placeholder={t("searchPlaceholder")} defaultValue={q ?? ""} />
              </Suspense>
            </div>
            <FilterTabs
              tabs={[
                { value: "all" as FilterMode, label: t("filterAll") },
                { value: "today" as FilterMode, label: t("filterToday", { count: todayCount }) },
                { value: "pem" as FilterMode, label: t("filterPem") },
              ]}
              active={filter}
              href={filterHref}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-medium text-slate-500">{t("client")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("date")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("mood")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("energy")}</th>
                  <th className="text-left py-2 font-medium text-slate-500">{t("sleep")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((ci) => (
                  <tr key={ci.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-slate-800">
                      <Link href={`/admin/clients/${ci.clientId}`} className="hover:text-teal-700 transition-colors">
                        {ci.clientName ?? ci.clientEmail}
                      </Link>
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(ci.createdAt)}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <span>{MOOD_EMOJI[ci.mood] ?? "😐"}</span>
                        <span className="text-slate-600">{tCheckIn(moodMap[ci.mood]?.labelKey ?? "moodNeutral")}</span>
                        {ci.pemFlag && (
                          <span className="text-xs font-semibold text-red-600 ml-1">
                            PEM{ci.pemSeverity ? ` ${ci.pemSeverity}/10` : ""}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      <strong>{ci.energyLevel}</strong>
                      <span className="text-slate-400">/10</span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {ci.sleepHours != null ? (
                        <span><strong className="text-slate-700">{ci.sleepHours}</strong>h</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/clients/${ci.clientId}`}
                        className="text-teal-600 hover:underline text-xs font-medium"
                      >
                        {t("viewClient")}
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {filter === "today" ? t("noActivityToday") : q ? t("noResults", { q }) : t("noActivity")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} pageLink={pageHref} />
        </CardContent>
      </Card>
    </div>
  )
}
