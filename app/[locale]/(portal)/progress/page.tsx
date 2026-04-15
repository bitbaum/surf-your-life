import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { functionalAssessments, checkIns } from "@/lib/db/schema"
import { eq, asc, gte } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { formatDate } from "@/lib/utils"
import { Link } from "@/i18n/navigation"

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.progress")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const ninetyDaysAgo = new Date(new Date().getTime() - NINETY_DAYS_MS)

  const [assessments, recentCheckIns] = await Promise.all([
    db.query.functionalAssessments.findMany({
      where: eq(functionalAssessments.userId, userId),
      orderBy: [asc(functionalAssessments.assessedAt)],
    }),
    db.query.checkIns.findMany({
      where: (table, { and }) => and(
        eq(table.userId, userId),
        gte(table.createdAt, ninetyDaysAgo)
      ),
      orderBy: [asc(checkIns.createdAt)],
      columns: {
        energyLevel: true,
        mood: true,
        pemFlag: true,
        createdAt: true,
      },
    }),
  ])

  const first = assessments[0]
  const latest = assessments[assessments.length - 1]
  const delta = first && latest && assessments.length > 1
    ? latest.overallCapacity - first.overallCapacity
    : null

  // 90-day summary stats
  const totalCheckIns = recentCheckIns.length
  const pemEpisodes = recentCheckIns.filter((r) => r.pemFlag).length
  const avgEnergy = totalCheckIns > 0
    ? recentCheckIns.reduce((s, r) => s + r.energyLevel, 0) / totalCheckIns
    : null

  const MOOD_NUM: Record<string, number> = {
    very_low: 1, low: 2, neutral: 3, good: 4, excellent: 5,
  }
  const avgMoodNum = totalCheckIns > 0
    ? recentCheckIns.reduce((s, r) => s + (MOOD_NUM[r.mood ?? "neutral"] ?? 3), 0) / totalCheckIns
    : null
  const moodLabel =
    avgMoodNum == null ? "—" :
    avgMoodNum >= 4.5 ? "Excellent" :
    avgMoodNum >= 3.5 ? "Good" :
    avgMoodNum >= 2.5 ? "Neutral" :
    "Low"

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      {/* Recovery arc */}
      {assessments.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="py-12 text-center flex flex-col items-center gap-4">
            <p className="text-slate-400 max-w-sm">{t("noAssessments")}</p>
            <Link
              href="/assessments"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              {t("doAssessment")} →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Narrative summary */}
          <p className="text-sm text-slate-600 mt-2 mb-6">
            {assessments.length === 1
              ? `You've completed 1 assessment. Your overall capacity is ${first!.overallCapacity}/10.`
              : `You've completed ${assessments.length} assessments. Your overall capacity has changed from ${first!.overallCapacity}/10 to ${latest!.overallCapacity}/10.`}
          </p>

          {/* Assessment timeline */}
          <div className="flex flex-col gap-3">
            {assessments.map((a, i) => {
              const isFirst = i === 0
              const isLatest = i === assessments.length - 1
              const d = delta != null ? latest!.overallCapacity - first!.overallCapacity : null

              return (
                <Card key={a.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium text-slate-700">
                          {formatDate(a.assessedAt)}
                        </CardTitle>
                        {isFirst && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {t("firstAssessment")}
                          </span>
                        )}
                        {isLatest && assessments.length > 1 && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                            {t("latestAssessment")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isLatest && d != null && (
                          <span className={`text-xs font-medium ${d >= 0 ? "text-teal-600" : "text-red-500"}`}>
                            {d >= 0 ? t("improvementSince", { n: `+${d}` }) : t("declineSince", { n: d })}
                          </span>
                        )}
                        <span className="text-xl font-bold text-teal-700">
                          {a.overallCapacity}
                          <span className="text-xs font-normal text-slate-400">/10</span>
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-28">{t("overallCapacity")}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${(a.overallCapacity / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* 90-day summary */}
      {totalCheckIns > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("ninetyDaySummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("avgEnergy")}</span>
                <span className="text-xl font-bold text-slate-900">
                  {avgEnergy != null ? avgEnergy.toFixed(1) : "—"}
                  {avgEnergy != null && <span className="text-xs font-normal text-slate-400">/10</span>}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">Avg mood</span>
                <span className="text-xl font-bold text-slate-900">{moodLabel}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("totalCheckIns")}</span>
                <span className="text-xl font-bold text-slate-900">{totalCheckIns}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("pemEpisodes")}</span>
                <span className="text-xl font-bold text-slate-900">{pemEpisodes}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
