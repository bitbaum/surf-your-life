import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { functionalAssessments, checkIns } from "@/lib/db/schema"
import { eq, asc, gte } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { NINETY_DAYS_MS, MOODS, MOOD_SCORE, ASSESSMENTS_MAX } from "@/lib/constants"
import { summariseCheckIns } from "@/lib/domain/check-in"
import { AssessmentTimeline } from "./assessment-timeline"

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
      limit: ASSESSMENTS_MAX,
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
        sleepHours: true,
        stressLevel: true,
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
  const stats = summariseCheckIns(recentCheckIns)
  const totalCheckIns = stats?.count ?? 0
  const pemEpisodes = stats?.pemCount ?? 0
  const avgEnergy = stats?.avgEnergy ?? null
  const avgSleep = stats?.avgSleep ?? null
  const avgStress = stats?.avgStress ?? null
  const avgMoodNum = stats?.avgMoodNum ?? null
  // Round to nearest MOOD_SCORE for display — same algorithm as summariseCheckIns
  const avgMoodLabel = avgMoodNum == null ? null
    : (MOODS.find((m) => MOOD_SCORE[m.value] === Math.round(avgMoodNum))?.labelKey ?? "moodNeutral")

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <AssessmentTimeline assessments={assessments} delta={delta} />

      {totalCheckIns === 0 ? (
        <Card className="mt-6">
          <CardContent className="py-12">
            <EmptyState
              message={t("noRecentCheckIns")}
              action={<Link href="/check-in" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">{t("doCheckIn")} →</Link>}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("ninetyDaySummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("avgEnergy")}</span>
                <span className="text-xl font-bold text-slate-900">
                  {avgEnergy != null ? avgEnergy.toFixed(1) : "—"}
                  {avgEnergy != null && <span className="text-xs font-normal text-slate-400">/10</span>}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("avgMood")}</span>
                <span className="text-xl font-bold text-slate-900">
                  {avgMoodLabel == null ? "—" : t(avgMoodLabel)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("avgSleep")}</span>
                <span className="text-xl font-bold text-slate-900">
                  {avgSleep != null ? avgSleep.toFixed(1) : "—"}
                  {avgSleep != null && <span className="text-xs font-normal text-slate-400">h</span>}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("avgStress")}</span>
                <span className="text-xl font-bold text-slate-900">
                  {avgStress != null ? avgStress.toFixed(1) : "—"}
                  {avgStress != null && <span className="text-xs font-normal text-slate-400">/10</span>}
                </span>
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
