import { db } from "@/lib/db"
import { users, checkIns, bookings, threadMessages } from "@/lib/db/schema"
import { eq, desc, gte, count, and, isNull, inArray } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { Users, ClipboardList, TrendingUp, CalendarClock, MessageSquare } from "lucide-react"

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.dashboard")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    clientCountResult,
    recentCheckInsCountResult,
    pendingBookingsResult,
    unreadMessagesResult,
    recentClients,
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
      limit: 8,
      with: { profile: true },
    }),
  ])

  const clientCount = clientCountResult[0]?.count ?? 0
  const recentCheckInsCount = recentCheckInsCountResult[0]?.count ?? 0
  const pendingBookings = pendingBookingsResult[0]?.count ?? 0
  const unreadMessages = unreadMessagesResult[0]?.count ?? 0
  const avgCheckIns = clientCount > 0
    ? Math.round((recentCheckInsCount / clientCount) * 10) / 10
    : 0

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label={t("totalClients")} value={clientCount} icon={Users} color="teal" />
        <StatCard label={t("checkIns30d")} value={recentCheckInsCount} icon={ClipboardList} color="slate" />
        <StatCard label={t("avgCheckIns")} value={avgCheckIns} icon={TrendingUp} color="teal" />
        <StatCard label={t("pendingBookings")} value={pendingBookings} icon={CalendarClock} color="slate" />
        <StatCard label={t("unreadMessages")} value={unreadMessages} icon={MessageSquare} color="teal" />
      </div>

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
