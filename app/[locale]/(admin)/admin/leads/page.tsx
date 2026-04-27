import { db } from "@/lib/db"
import { leads, leadStatusEnum } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate, computeTotalPages, parsePagination } from "@/lib/utils"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { LeadStatus } from "./lead-status"
import { InviteButton } from "./invite-button"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Pagination } from "@/components/ui/pagination"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { EmptyState } from "@/components/ui/empty-state"
import { Link } from "@/i18n/navigation"

type LeadStatusValue = (typeof leadStatusEnum.enumValues)[number]
type StatusFilter = "all" | LeadStatusValue

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.leads")

  const STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("filterAll") },
    { value: "new", label: t("statusNew") },
    { value: "contacted", label: t("statusContacted") },
    { value: "dismissed", label: t("statusDismissed") },
  ]

  const { page: pageParam, status: statusParam } = await searchParams
  const { page, offset } = parsePagination(pageParam)

  const statusFilter = (leadStatusEnum.enumValues as readonly string[]).includes(statusParam ?? "")
    ? (statusParam as LeadStatusValue)
    : "all"

  const whereClause =
    statusFilter !== "all" ? eq(leads.status, statusFilter) : undefined

  const [all, totalResult] = await Promise.all([
    db.query.leads.findMany({
      where: whereClause,
      orderBy: [desc(leads.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
    }),
    db.select({ count: count() }).from(leads).where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  function tabLink(s: StatusFilter) {
    const urlParams = new URLSearchParams()
    if (s !== "all") urlParams.set("status", s)
    urlParams.set("page", "1")
    return `/admin/leads?${urlParams.toString()}`
  }

  function pageLink(p: number) {
    const urlParams = new URLSearchParams()
    if (statusFilter !== "all") urlParams.set("status", statusFilter)
    urlParams.set("page", String(p))
    return `/admin/leads?${urlParams.toString()}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={t("title")} description={`${total} ${t("title").toLowerCase()}`} />

      <FilterTabs
        tabs={STATUS_TABS}
        active={statusFilter}
        href={tabLink}
      />

      <Card>
        <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <div className="py-8">
              <EmptyState
                message={t("noLeads")}
                action={statusFilter !== "all" ? (
                  <Link href="/admin/leads" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">{t("viewAll")}</Link>
                ) : undefined}
              />
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {all.map((lead) => (
                <div key={lead.id} className="py-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <a href={`mailto:${lead.email}`} className="text-sm text-teal-600 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(lead.createdAt)}</span>
                  </div>
                  {lead.message && (
                    <p className="text-sm text-slate-500 leading-relaxed mb-2">{lead.message}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <LeadStatus leadId={lead.id} currentStatus={lead.status} />
                    <InviteButton leadId={lead.id} currentStatus={lead.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
        </CardContent>
      </Card>
    </div>
  )
}
