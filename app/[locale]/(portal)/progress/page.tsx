import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { functionalAssessments, checkIns, techniqueAssignments, techniqueLogs } from "@/lib/db/schema"
import { eq, asc, gte, and } from "drizzle-orm"
import { localDateString, addDaysISO } from "@/lib/utils"
import { computeDailyAdherenceTrend } from "@/lib/domain/techniques"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { NINETY_DAYS_MS, MOODS, MOOD_SCORE, ASSESSMENTS_MAX } from "@/lib/constants"
import { summariseCheckIns } from "@/lib/domain/check-in"
import { AssessmentTimeline } from "./assessment-timeline"
import { ProgressChartsSection } from "./progress-charts-section"

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.progress")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id
  const ninetyDaysAgo = new Date(new Date().getTime() - NINETY_DAYS_MS)
  const today = localDateString(new Date())
  const thirtyDaysAgo = addDaysISO(today, -30)

  const [assessments, recentCheckIns, activeAssignments, techLogs] = await Promise.all([
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
        symptomFatigue: true,
        symptomBrainFog: true,
        symptomPain: true,
        createdAt: true,
      },
    }),
    db.query.techniqueAssignments.findMany({
      where: and(eq(techniqueAssignments.clientId, userId), eq(techniqueAssignments.isActive, true)),
      columns: { id: true, frequencyPerDay: true, startDate: true, endDate: true },
    }),
    db.query.techniqueLogs.findMany({
      where: and(eq(techniqueLogs.userId, userId), gte(techniqueLogs.date, thirtyDaysAgo)),
      columns: { assignmentId: true, date: true, completedReps: true },
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

  const techniqueTrend = computeDailyAdherenceTrend(activeAssignments, techLogs, today, 30)
  const avgTechAdherence = techniqueTrend.length > 0
    ? Math.round(techniqueTrend.reduce((s, d) => s + d.pct, 0) / techniqueTrend.length)
    : 0
  const reversedTrend = [...techniqueTrend].reverse()
  const breakIdx = reversedTrend.findIndex((d) => d.pct < 100)
  const currentStreak = breakIdx === -1 ? techniqueTrend.filter((d) => d.pct === 100).length : breakIdx

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <ProgressChartsSection checkIns={recentCheckIns} assessments={assessments} />

      <AssessmentTimeline assessments={assessments} delta={delta} />

      {activeAssignments.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("techniquePractice")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("techniqueAdherence")}</span>
                <span className="text-xl font-bold text-slate-900">
                  {avgTechAdherence}<span className="text-xs font-normal text-slate-400">%</span>
                </span>
                <span className="text-xs text-slate-400">{t("thirtyDays")}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-500">{t("techniqueStreak")}</span>
                <span className="text-xl font-bold text-slate-900">
                  {currentStreak}<span className="text-xs font-normal text-slate-400"> {t("days")}</span>
                </span>
                <span className="text-xs text-slate-400">{t("streakSubtitle")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
