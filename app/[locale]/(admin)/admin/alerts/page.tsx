import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { clientAlerts, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { PageHeader } from "@/components/ui/page-header"
import { AlertList } from "./alert-list"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function AlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.alerts")

  const session = await auth()
  if (!session?.user || !["admin", "practitioner"].includes(session.user.role)) {
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

  const total = rows.length
  const highCount = rows.filter((r) => r.severity === "high").length

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
      <AlertList initialAlerts={rows} />
    </div>
  )
}
