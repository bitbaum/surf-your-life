import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { clientAlerts, users, checkIns } from "@/lib/db/schema"
import { eq, desc, and, gte, inArray, sql } from "drizzle-orm"
import { PageHeader } from "@/components/ui/page-header"
import { AlertList } from "./alert-list"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { ADMIN_ALERTS_MAX, SEVEN_DAYS_MS } from "@/lib/constants"
import { buildLastNDayStrings } from "@/lib/utils"

export default async function AlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.alerts")
  const tClients = await getTranslations("admin.clients")

  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    redirect("/login")
  }

  const rows = await db
    .select({
      id: clientAlerts.id,
      type: clientAlerts.type,
      severity: clientAlerts.severity,
      title: clientAlerts.title,
      message: clientAlerts.message,
      createdAt: clientAlerts.createdAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(clientAlerts)
    .innerJoin(users, eq(users.id, clientAlerts.clientId))
    .where(eq(clientAlerts.isResolved, false))
    .orderBy(desc(clientAlerts.createdAt))
    .limit(ADMIN_ALERTS_MAX)

  const total = rows.length
  const highCount = rows.filter((r) => r.severity === "high").length

  // Per-client 7-day cadence so practitioners can triage "is this client
  // otherwise active?" without clicking through. Single batched query
  // bucketed by (userId, day) with bool_or(pemFlag) — same shape as the
  // clients-list aggregation.
  const clientIds = [...new Set(rows.map((r) => r.client.id))]
  const sparkData: Record<string, { checkedIn: string[]; pemDays: string[] }> = {}
  if (clientIds.length > 0) {
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
    const dayExpr = sql<string>`to_char(${checkIns.createdAt}, 'YYYY-MM-DD')`
    const dayRows = await db
      .select({
        userId: checkIns.userId,
        day: dayExpr,
        hadPem: sql<boolean>`bool_or(${checkIns.pemFlag})`,
      })
      .from(checkIns)
      .where(and(
        gte(checkIns.createdAt, sevenDaysAgo),
        inArray(checkIns.userId, clientIds)
      ))
      .groupBy(checkIns.userId, dayExpr)
    for (const r of dayRows) {
      const entry = sparkData[r.userId] ?? { checkedIn: [], pemDays: [] }
      entry.checkedIn.push(r.day)
      if (r.hadPem) entry.pemDays.push(r.day)
      sparkData[r.userId] = entry
    }
  }

  const sparkDays = buildLastNDayStrings(7)
  const sparkLabels = {
    missed: tClients("dotMissed"),
    checkedIn: tClients("dotCheckedIn"),
    pem: tClients("dotPem"),
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t("title")}
        description={
          total === 0
            ? t("descriptionEmpty")
            : highCount > 0
            ? t("descriptionWithHigh", { total, high: highCount })
            : t("description", { total })
        }
      />
      <AlertList
        initialAlerts={rows}
        sparkDays={sparkDays}
        sparkData={sparkData}
        sparkLabels={sparkLabels}
        sparkHint={tClients("cadenceHint")}
      />
    </div>
  )
}
