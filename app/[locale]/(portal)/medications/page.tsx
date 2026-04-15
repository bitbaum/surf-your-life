import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { medicationLog } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { MedicationManager } from "./medication-manager"

export default async function MedicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.medications")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const medications = await db.query.medicationLog.findMany({
    where: eq(medicationLog.userId, session.user.id),
    orderBy: [desc(medicationLog.createdAt)],
  })

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-slate-500 mt-1">{t("description")}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <MedicationManager medications={medications} />
        </CardContent>
      </Card>
    </div>
  )
}
