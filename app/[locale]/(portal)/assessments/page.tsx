import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { functionalAssessments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { formatDate } from "@/lib/utils"
import { AssessmentsClient } from "./assessments-client"

const CAPACITY_DIMENSIONS = [
  "overallCapacity",
  "physicalCapacity",
  "cognitiveCapacity",
  "emotionalCapacity",
  "socialCapacity",
] as const

export default async function AssessmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.assessments")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const history = await db.query.functionalAssessments.findMany({
    where: eq(functionalAssessments.userId, session.user.id),
    orderBy: [desc(functionalAssessments.assessedAt)],
    limit: 20,
  })

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("description")}</p>
        </div>
      </div>

      <AssessmentsClient history={history} />

      {history.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {history.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{formatDate(a.assessedAt)}</CardTitle>
                  <span className="text-2xl font-bold text-teal-700">{a.overallCapacity}<span className="text-sm font-normal text-slate-400">/10</span></span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {CAPACITY_DIMENSIONS.slice(1).map((dim) => {
                    const val = a[dim]
                    if (val == null) return null
                    return (
                      <div key={dim} className="flex items-center justify-between">
                        <span className="text-slate-500">{t(dim as Parameters<typeof t>[0])}</span>
                        <div className="flex items-center gap-2">
                          <ProgressBar value={(val / 10) * 100} size="sm" className="w-20" />
                          <span className="font-medium text-slate-700 w-6 text-right">{val}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {a.notes && <p className="text-xs text-slate-500 mt-3 leading-relaxed">{a.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {history.length === 0 && (
        <Card className="mt-4">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">{t("empty")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
