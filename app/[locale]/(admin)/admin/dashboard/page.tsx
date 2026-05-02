import { db } from "@/lib/db"
import { users, checkIns, bookings, threadMessages, clientAlerts } from "@/lib/db/schema"
import { eq, desc, gte, count, and, isNull, max, sql } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { Users, ClipboardList, TrendingUp, CalendarClock, MessageSquare, AlertTriangle } from "lucide-react"
import { SEVEN_DAYS_MS, THIRTY_DAYS_MS, RECENT_CLIENTS_LIMIT, AT_RISK_CLIENTS_LIMIT, ADMIN_DASHBOARD_ALERTS_PREVIEW, ADMIN_DASHBOARD_INSIGHTS_PREVIEW, CLINIC_TZ } from "@/lib/constants"
import { roundOne } from "@/lib/utils"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { fetchCadenceMap } from "@/lib/db/check-in-cadence"
import { atRiskHaving } from "@/lib/db/at-risk"
import { getUnresolvedAlertCount } from "@/components/admin/unread-count"
import { AlertList } from "./alert-list"
import { AtRiskClientsCard } from "./at-risk-clients-card"
import { RecentClientsCard } from "./recent-clients-card"
import { LatestInsightsCard } from "./latest-insights-card"
import { ClinicPulseCard } from "./clinic-pulse-card"

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.dashboard")

  const nowMs = Date.now()
  const thirtyDaysAgo = new Date(nowMs - THIRTY_DAYS_MS)
  const sevenDaysAgo = new Date(nowMs - SEVEN_DAYS_MS)

  const [
    clientCountResult,
    recentCheckInsCountResult,
    pendingBookingsResult,
    unreadMessagesResult,
    recentClients,
    atRiskCountResult,
    atRiskPreview,
    unresolvedAlertsCount,
    unresolvedAlerts,
    clinicPulseRaw,
    latestInsightsRaw,
  ] = await Promise.all([
    db.select({ count: count() }).from(users).where(eq(users.role, CLIENT_ROLE)),
    db.select({ count: count() }).from(checkIns).where(gte(checkIns.createdAt, thirtyDaysAgo)),
    db.select({ count: count() }).from(bookings).where(eq(bookings.status, "pending")),
    db
      .select({ count: count() })
      .from(threadMessages)
      .innerJoin(users, eq(threadMessages.senderId, users.id))
      .where(and(isNull(threadMessages.readAt), eq(users.role, CLIENT_ROLE))),
    db.query.users.findMany({
      where: eq(users.role, CLIENT_ROLE),
      orderBy: [desc(users.createdAt)],
      limit: RECENT_CLIENTS_LIMIT,
      with: { profile: true },
    }),
    // Count of all at-risk clients (for the stat card)
    db
      .select({ count: count() })
      .from(
        db
          .select({ userId: users.id })
          .from(users)
          .leftJoin(checkIns, eq(checkIns.userId, users.id))
          .where(eq(users.role, CLIENT_ROLE))
          .groupBy(users.id)
          .having(atRiskHaving(sevenDaysAgo))
          .as("at_risk_sub")
      ),
    // Preview: worst N at-risk clients for dashboard card
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        lastCheckIn: max(checkIns.createdAt),
      })
      .from(users)
      .leftJoin(checkIns, eq(checkIns.userId, users.id))
      .where(eq(users.role, CLIENT_ROLE))
      .groupBy(users.id, users.name, users.email)
      .having(atRiskHaving(sevenDaysAgo))
      .orderBy(max(checkIns.createdAt))
      .limit(AT_RISK_CLIENTS_LIMIT),
    // Total unresolved alert count (for accurate header display)
    getUnresolvedAlertCount(),
    // Preview: most recent N unresolved alerts
    db.query.clientAlerts.findMany({
      where: eq(clientAlerts.isResolved, false),
      orderBy: [desc(clientAlerts.createdAt)],
      limit: ADMIN_DASHBOARD_ALERTS_PREVIEW,
      with: { client: { columns: { id: true, name: true, email: true } } },
    }),
    // 30-day clinic pulse: daily avg energy + active client count per clinic-local day
    db.execute<{ day: string; avg_energy: string; active_clients: string }>(sql`
      SELECT
        to_char((${checkIns.createdAt} AT TIME ZONE 'UTC') AT TIME ZONE ${CLINIC_TZ}, 'YYYY-MM-DD') AS day,
        ROUND(AVG(${checkIns.energyLevel})::numeric, 1)::float8 AS avg_energy,
        COUNT(DISTINCT ${checkIns.userId})::int AS active_clients
      FROM ${checkIns}
      JOIN ${users} ON ${users.id} = ${checkIns.userId}
      WHERE ${users.role} = ${CLIENT_ROLE}
        AND ${checkIns.createdAt} >= ${thirtyDaysAgo}
      GROUP BY 1
      ORDER BY 1 ASC
    `),
    // Latest AI insight per client — outer ORDER BY recency so we show the N most recently updated clients
    db.execute<{ client_id: string; client_name: string | null; ai_insight: string; created_at: string }>(sql`
      SELECT * FROM (
        SELECT DISTINCT ON (ci.user_id)
          ci.user_id  AS client_id,
          u.name      AS client_name,
          ci.ai_insight,
          ci.created_at
        FROM check_ins ci
        JOIN users u ON u.id = ci.user_id
        WHERE ci.ai_insight IS NOT NULL
          AND u.role = ${CLIENT_ROLE}
        ORDER BY ci.user_id, ci.created_at DESC
      ) latest_per_client
      ORDER BY created_at DESC
      LIMIT ${ADMIN_DASHBOARD_INSIGHTS_PREVIEW}
    `),
  ])

  const clientCount = clientCountResult[0]?.count ?? 0
  const recentCheckInsCount = recentCheckInsCountResult[0]?.count ?? 0
  const pendingBookings = pendingBookingsResult[0]?.count ?? 0
  const unreadMessages = unreadMessagesResult[0]?.count ?? 0
  const avgCheckIns = clientCount > 0 ? roundOne(recentCheckInsCount / clientCount) : 0

  const atRiskCount = atRiskCountResult[0]?.count ?? 0
  const atRiskClients = atRiskPreview
  const clinicPulseData = clinicPulseRaw.rows.map((r) => ({
    day: r.day,
    avgEnergy: parseFloat(r.avg_energy),
    activeClients: parseInt(r.active_clients, 10),
  }))
  const latestInsights = latestInsightsRaw.rows.map((r) => ({
    clientId: r.client_id,
    clientName: r.client_name,
    aiInsight: r.ai_insight,
    createdAt: new Date(r.created_at),
  }))

  // Single batched cadence fetch for both cards — avoids two round-trips.
  const cadenceClientIds = [
    ...new Set([
      ...recentClients.map((c) => c.id),
      ...latestInsights.map((i) => i.clientId),
    ]),
  ]
  const cadenceMap = await fetchCadenceMap(cadenceClientIds, sevenDaysAgo)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-8">
        <StatCard label={t("totalClients")} value={clientCount} icon={Users} color="teal" href="/admin/clients" />
        <StatCard label={t("checkIns30d")} value={recentCheckInsCount} icon={ClipboardList} color="slate" href="/admin/check-ins" />
        <StatCard label={t("avgCheckIns")} value={avgCheckIns} icon={TrendingUp} color="teal" />
        <StatCard label={t("pendingBookings")} value={pendingBookings} icon={CalendarClock} color="slate" href="/admin/bookings" />
        <StatCard label={t("unreadMessages")} value={unreadMessages} icon={MessageSquare} color="teal" href="/admin/messages" />
        <StatCard
          label={t("atRiskClients")}
          value={atRiskCount}
          icon={AlertTriangle}
          color={atRiskCount > 0 ? "amber" : "slate"}
          href="/admin/clients/at-risk"
        />
      </div>

      {unresolvedAlertsCount > 0 && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                {t("clinicalAlerts")} ({unresolvedAlertsCount})
              </CardTitle>
              <Link href="/admin/alerts" className="text-sm text-red-600 hover:underline">
                {t("viewAll")} →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <AlertList alerts={unresolvedAlerts} />
          </CardContent>
        </Card>
      )}

      <ClinicPulseCard data={clinicPulseData} />
      <LatestInsightsCard insights={latestInsights} cadence={cadenceMap} />
      <AtRiskClientsCard clients={atRiskClients} nowMs={nowMs} />
      <RecentClientsCard clients={recentClients} cadence={cadenceMap} />
    </div>
  )
}
