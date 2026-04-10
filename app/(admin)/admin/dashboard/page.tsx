import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, desc, gte, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { Users, ClipboardList, TrendingUp } from "lucide-react"

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [clientCountResult, recentCheckInsCountResult, recentClients] = await Promise.all([
    db.select({ count: count() }).from(users).where(eq(users.role, "client")),
    db.select({ count: count() }).from(checkIns).where(gte(checkIns.createdAt, thirtyDaysAgo)),
    db.query.users.findMany({
      where: eq(users.role, "client"),
      orderBy: [desc(users.createdAt)],
      limit: 8,
      with: { profile: true },
    }),
  ])

  const clientCount = clientCountResult[0]?.count ?? 0
  const recentCheckInsCount = recentCheckInsCountResult[0]?.count ?? 0
  const avgCheckIns = clientCount > 0
    ? Math.round((recentCheckInsCount / clientCount) * 10) / 10
    : 0

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Admin Dashboard" description="Overview of the Surf Your Life portal" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total clients" value={clientCount} icon={Users} color="teal" />
        <StatCard label="Check-ins (30 days)" value={recentCheckInsCount} icon={ClipboardList} color="blue" />
        <StatCard label="Avg check-ins / client" value={avgCheckIns} icon={TrendingUp} color="violet" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent clients</CardTitle>
            <Link href="/admin/clients" className="text-sm text-teal-600 hover:underline">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-slate-100">
            {recentClients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{client.name ?? "—"}</p>
                  <p className="text-xs text-slate-400">{client.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    {client.profile?.mainConcern ? formatEnumValue(client.profile.mainConcern) : "No profile yet"}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(client.createdAt)}</p>
                </div>
              </Link>
            ))}
            {recentClients.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No clients yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
