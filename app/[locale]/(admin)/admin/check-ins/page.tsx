import { db } from "@/lib/db"
import { checkIns, users } from "@/lib/db/schema"
import { eq, and, or, ilike, desc, count } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { formatDate, computeTotalPages, parsePagination } from "@/lib/utils"
import { PAGINATION_DEFAULT, MOOD_EMOJI, MOODS } from "@/lib/constants"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Suspense } from "react"

export default async function AdminCheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; pem?: string; q?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.checkIns")
  const tCheckIn = await getTranslations("portal.checkIn")
  const moodMap = Object.fromEntries(MOODS.map((m) => [m.value, m]))

  const { page: pageParam, pem: pemParam, q } = await searchParams
  const pemOnly = pemParam === "true"
  const { page, offset } = parsePagination(pageParam)

  const searchFilter = q?.trim()
    ? or(
        ilike(users.name, `%${q.trim()}%`),
        ilike(users.email, `%${q.trim()}%`)
      )
    : undefined

  const roleFilter = eq(users.role, CLIENT_ROLE)
  const pemFilter = pemOnly ? eq(checkIns.pemFlag, true) : undefined
  const whereParts = [roleFilter, searchFilter, pemFilter].filter(
    (p): p is NonNullable<typeof p> => p != null
  )
  const whereClause = whereParts.length > 1 ? and(...whereParts) : whereParts[0]

  const [rows, totalResult] = await Promise.all([
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
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  // Build href helpers that preserve existing query params across filter/page changes
  const pemHref = (v: string) => {
    const params = new URLSearchParams()
    if (v === "pem") params.set("pem", "true")
    if (q?.trim()) params.set("q", q.trim())
    const qs = params.toString()
    return qs ? `/admin/check-ins?${qs}` : "/admin/check-ins"
  }
  const pageHref = (p: number) => {
    const params = new URLSearchParams()
    if (pemOnly) params.set("pem", "true")
    if (q?.trim()) params.set("q", q.trim())
    params.set("page", String(p))
    return `/admin/check-ins?${params.toString()}`
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
                { value: "all", label: t("filterAll") },
                { value: "pem", label: t("filterPem") },
              ]}
              active={pemOnly ? "pem" : "all"}
              href={pemHref}
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
                      {q ? t("noResults", { q }) : t("noActivity")}
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
