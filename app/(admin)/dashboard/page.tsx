import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, desc, gte, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of the Surf Your Life portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{clientCount}</p>
                <p className="text-xs text-slate-500">Total clients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{recentCheckInsCount}</p>
                <p className="text-xs text-slate-500">Check-ins (30 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {clientCount > 0 ? Math.round(recentCheckInsCount / clientCount * 10) / 10 : 0}
                </p>
                <p className="text-xs text-slate-500">Avg check-ins / client</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  <p className="text-xs text-slate-500 capitalize">
                    {client.profile?.mainConcern?.replace("_", " ") ?? "No profile yet"}
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
