import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { checkIns, users } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { Pagination } from "@/components/ui/pagination"
import { formatDate, formatEnumValue, computeTotalPages, parsePage, computeOffset } from "@/lib/utils"
import { PAGINATION_DEFAULT, MOOD_EMOJI } from "@/lib/constants"
import { FilterTabs } from "@/components/ui/filter-tabs"

export default async function AdminCheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; pem?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.checkIns")

  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) redirect("/login")

  const { page: pageParam, pem: pemParam } = await searchParams
  const pemOnly = pemParam === "true"
  const page = parsePage(pageParam)
  const offset = computeOffset(page, PAGINATION_DEFAULT)

  const whereClause = pemOnly ? eq(checkIns.pemFlag, true) : undefined

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
    db.select({ count: count() }).from(checkIns).where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <Card>
        <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
        <CardContent>
          <FilterTabs
            tabs={[
              { value: "all", label: t("filterAll") },
              { value: "pem", label: t("filterPem") },
            ]}
            active={pemOnly ? "pem" : "all"}
            href={(v) => v === "pem" ? "/admin/check-ins?pem=true" : "/admin/check-ins"}
          />
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
                      {ci.clientName ?? ci.clientEmail}
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(ci.createdAt)}</td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <span>{MOOD_EMOJI[ci.mood] ?? "😐"}</span>
                        <span className="text-slate-600">{formatEnumValue(ci.mood)}</span>
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
                      {t("noActivity")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} pageLink={(p) => pemOnly ? `/admin/check-ins?pem=true&page=${p}` : `/admin/check-ins?page=${p}`} />
        </CardContent>
      </Card>
    </div>
  )
}
