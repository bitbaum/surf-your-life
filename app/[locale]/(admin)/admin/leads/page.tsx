import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate } from "@/lib/utils"

export default async function LeadsPage() {
  const all = await db.query.leads.findMany({
    orderBy: [desc(leads.createdAt)],
  })

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Leads" description={`${all.length} contact submission${all.length !== 1 ? "s" : ""}`} />

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
                    <p className="text-sm text-slate-500 leading-relaxed">{lead.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
