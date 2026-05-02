import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { computeTotalPages, parsePagination } from "@/lib/utils"
import { CheckInRow } from "../check-in-row"
import { EmptyState } from "@/components/ui/empty-state"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Download } from "lucide-react"

export default async function ClientCheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const { page: pageParam } = await searchParams
  const { page, offset } = parsePagination(pageParam)

  const [client, clientCheckIns, countResult] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, id) }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, id),
      orderBy: [desc(checkIns.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
    }),
    db.select({ count: count() }).from(checkIns).where(eq(checkIns.userId, id)),
  ])

  if (!client || client.role !== CLIENT_ROLE) notFound()

  const total = countResult[0]?.count ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  function pageLink(p: number) {
    return `/admin/clients/${id}/check-ins?page=${p}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/admin/clients/${id}`} className="text-sm text-slate-400 hover:text-slate-600">
          {t("checkIns.backLink", { name: client.name ?? t("detail.unnamed") })}
        </Link>
      </div>

      <PageHeader
        title={t("checkIns.title")}
        description={t("checkIns.description", { name: client.name ?? client.email ?? t("detail.unnamed"), count: total })}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("detail.checkInsCard")} ({total})</CardTitle>
            {total > 0 && (
              <a
                href={`/api/admin/clients/${id}/export`}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-300 rounded-lg px-3 py-1.5 transition-colors"
                download
              >
                <Download className="w-3.5 h-3.5" />
                {t("checkIns.exportCsv")}
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {clientCheckIns.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {clientCheckIns.map((ci) => (
                <CheckInRow key={ci.id} ci={ci} />
              ))}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState message={t("detail.noCheckIns")} />
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
        </CardContent>
      </Card>
    </div>
  )
}
