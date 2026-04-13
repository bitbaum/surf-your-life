import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, max, sql } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export default async function AtRiskClientsPage() {
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)

  const clientsWithLastCheckIn = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      lastCheckIn: max(checkIns.createdAt),
    })
    .from(users)
    .leftJoin(checkIns, eq(checkIns.userId, users.id))
    .where(eq(users.role, "client"))
    .groupBy(users.id, users.name, users.email, users.createdAt)

  const atRisk = clientsWithLastCheckIn.filter(
    (c) => c.lastCheckIn === null || c.lastCheckIn < sevenDaysAgo
  )

  function daysSince(date: Date | null): string {
    if (!date) return "—"
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    return `${days} days ago`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="At-Risk Clients"
        description="Clients who haven't checked in for 7+ days"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>At-risk clients ({atRisk.length})</CardTitle>
            <Link href="/admin/clients" className="text-sm text-teal-600 hover:underline">
              ← All clients
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {atRisk.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">
              All clients have checked in recently
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 font-medium text-slate-500">Name</th>
                  <th className="text-left py-2 font-medium text-slate-500">Email</th>
                  <th className="text-left py-2 font-medium text-slate-500">Last check-in</th>
                  <th className="text-left py-2 font-medium text-slate-500">Days since</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {atRisk.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 font-medium text-slate-800">{client.name ?? "—"}</td>
                    <td className="py-3 text-slate-600">{client.email}</td>
                    <td className="py-3 text-slate-500">
                      {client.lastCheckIn ? formatDate(client.lastCheckIn) : "Never"}
                    </td>
                    <td className="py-3 text-slate-400">{daysSince(client.lastCheckIn)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="text-teal-600 hover:underline text-xs font-medium"
                        >
                          View →
                        </Link>
                        <a
                          href={`mailto:${client.email}`}
                          className="text-xs text-slate-500 hover:text-teal-600 transition-colors"
                        >
                          Send message
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
