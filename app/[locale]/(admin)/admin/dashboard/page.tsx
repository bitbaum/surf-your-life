import { db } from "@/lib/db"
import { users, checkIns, bookings, threadMessages, clientAlerts } from "@/lib/db/schema"
import { eq, desc, gte, count, and, isNull, max } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { Users, ClipboardList, TrendingUp, CalendarClock, MessageSquare, AlertTriangle } from "lucide-react"
import { SEVEN_DAYS_MS, THIRTY_DAYS_MS, RECENT_CLIENTS_LIMIT, AT_RISK_CLIENTS_LIMIT, DAY_MS } from "@/lib/constants"
import { AlertList } from "./alert-list"

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.dashboard")

  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS)
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)

  const [
    clientCountResult,
    recentCheckInsCountResult,
    pendingBookingsResult,
    unreadMessagesResult,
    recentClients,
    allClientsLastCheckIn,
    unresolvedAlerts,
  ] = await Promise.all([
    db.select({ count: count() }).from(users).where(eq(users.role, "client")),
    db.select({ count: count() }).from(checkIns).where(gte(checkIns.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(bookings).where(eq(bookings.status, "pending")),
    db
      .select({ count: count() })
      .from(threadMessages)
      .innerJoin(users, eq(threadMessages.senderId, users.id))
      .where(and(isNull(threadMessages.readAt), eq(users.role, "client"))),
    db.query.users.findMany({
      where: eq(users.role, "client"),
      orderBy: [desc(users.createdAt)],
      limit: RECENT_CLIENTS_LIMIT,
      with: { profile: true },
    }),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        lastCheckIn: max(checkIns.createdAt),
      })
      .from(users)
      .leftJoin(checkIns, eq(checkIns.userId, users.id))
      .where(eq(users.role, "client"))
      .groupBy(users.id, users.name, users.email),
    db.query.clientAlerts.findMany({
      where: eq(clientAlerts.isResolved, false),
      orderBy: [desc(clientAlerts.createdAt)],
      limit: 10,
      with: { client: { columns: { id: true, name: true, email: true } } },
    }),
  ])

  const clientCount = clientCountResult[0]?.count ?? 0
  const recentCheckInsCount = recentCheckInsCountResult[0]?.count ?? 0
  const pendingBookings = pendingBookingsResult[0]?.count ?? 0
  const unreadMessages = unreadMessagesResult[0]?.count ?? 0
  const avgCheckIns = clientCount > 0
    ? Math.round((recentCheckInsCount / clientCount) * 10) / 10
    : 0

  const atRiskClients = allClientsLastCheckIn
    .filter((c) => c.lastCheckIn === null || c.lastCheckIn < sevenDaysAgo)
    .sort((a, b) => {
      if (a.lastCheckIn === null) return -1
      if (b.lastCheckIn === null) return 1
      return a.lastCheckIn.getTime() - b.lastCheckIn.getTime()
    })
    .slice(0, AT_RISK_CLIENTS_LIMIT)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8">
        <StatCard label={t("totalClients")} value={clientCount} icon={Users} color="teal" />
        <StatCard label={t("checkIns30d")} value={recentCheckInsCount} icon={ClipboardList} color="slate" />
        <StatCard label={t("avgCheckIns")} value={avgCheckIns} icon={TrendingUp} color="teal" />
        <StatCard label={t("pendingBookings")} value={pendingBookings} icon={CalendarClock} color="slate" />
        <StatCard label={t("unreadMessages")} value={unreadMessages} icon={MessageSquare} color="teal" />
        <StatCard
          label={t("atRiskClients")}
          value={atRiskClients.length}
          icon={AlertTriangle}
          color={atRiskClients.length > 0 ? "amber" : "slate"}
        />
      </div>

      {unresolvedAlerts.length > 0 && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              {t("clinicalAlerts")} ({unresolvedAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertList alerts={unresolvedAlerts} />
          </CardContent>
        </Card>
      )}

      {atRiskClients.length > 0 && (
        <Card className="mb-6 border-amber-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-4 h-4" />
                {t("needsAttention")}
              </CardTitle>
              <Link href="/admin/clients/at-risk" className="text-sm text-amber-600 hover:underline">
                {t("viewAll")} →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-slate-100">
              {atRiskClients.map((client) => {
                const daysAgo = client.lastCheckIn
                  ? Math.floor((Date.now() - client.lastCheckIn.getTime()) / DAY_MS)
                  : null
                return (
                  <Link
                    key={client.id}
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{client.name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{client.email}</p>
                    </div>
                    <p className="text-xs text-amber-600 font-medium">
                      {daysAgo === null ? t("never") : t("daysAgo", { n: daysAgo })}
                    </p>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("recentClients")}</CardTitle>
            <Link href="/admin/clients" className="text-sm text-teal-600 hover:underline">
              {t("viewAll")} →
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
                    {client.profile?.mainConcern
                      ? formatEnumValue(client.profile.mainConcern)
                      : t("noProfile")}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(client.createdAt)}</p>
                </div>
              </Link>
            ))}
            {recentClients.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">{t("noClients")}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
