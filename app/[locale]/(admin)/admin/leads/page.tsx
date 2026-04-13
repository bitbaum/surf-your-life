import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { desc, count, eq, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { LeadStatus } from "./lead-status"

type StatusFilter = "all" | "new" | "contacted" | "dismissed"

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "dismissed", label: "Dismissed" },
]

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const { page: pageParam, status: statusParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT

  const statusFilter =
    statusParam === "new" || statusParam === "contacted" || statusParam === "dismissed"
      ? statusParam
      : "all"

  const whereClause =
    statusFilter !== "all" ? eq(leads.status, statusFilter) : undefined

  const [all, totalResult] = await Promise.all([
    whereClause
      ? db.query.leads.findMany({
          where: whereClause,
          orderBy: [desc(leads.createdAt)],
          limit: PAGINATION_DEFAULT,
          offset,
        })
      : db.query.leads.findMany({
          orderBy: [desc(leads.createdAt)],
          limit: PAGINATION_DEFAULT,
          offset,
        }),
    whereClause
      ? db.select({ count: count() }).from(leads).where(whereClause)
      : db.select({ count: count() }).from(leads),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / PAGINATION_DEFAULT)

  function tabLink(s: StatusFilter) {
    const params = new URLSearchParams()
    if (s !== "all") params.set("status", s)
    params.set("page", "1")
    return `/admin/leads?${params.toString()}`
  }

  function pageLink(p: number) {
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    params.set("page", String(p))
    return `/admin/leads?${params.toString()}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Leads" description={`${total} contact submission${total !== 1 ? "s" : ""}`} />

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tabLink(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              statusFilter === tab.value
                ? "bg-teal-600 text-white font-medium"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All leads</CardTitle></CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No leads yet</p>
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
                  <LeadStatus leadId={lead.id} currentStatus={lead.status} />
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={pageLink(page - 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    ← Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={pageLink(page + 1)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
