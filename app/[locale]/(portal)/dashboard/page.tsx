import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, profiles, users, programEnrollments } from "@/lib/db/schema"
import { eq, desc, asc, and, gte, count } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { ClipboardList, TrendingUp, Flame } from "lucide-react"
import {
  ONBOARDING_REQUIRED_FIELDS,
  PROFILE_COMPLETION_FIELDS,
  RECENT_CHECK_INS_LIMIT,
  THIRTY_DAYS_MS,
  SEVEN_DAYS_MS,
  DASHBOARD_INSIGHT_ENERGY_WINDOW,
} from "@/lib/constants"
import {
  computeStreak,
  computeProgramProgress,
  computeReturnNudge,
  computeWeekDelta,
  detectMilestone,
  computeInsight,
} from "@/lib/domain/check-in"
import { TrendCard } from "@/components/ui/trend-card"
import { EmailVerificationBanner } from "@/components/portal/EmailVerificationBanner"
import { PageHeader } from "@/components/ui/page-header"
import { ProgressBar } from "@/components/ui/progress-bar"
import { DashboardBanners } from "./dashboard-banners"
import { DashboardCharts } from "./dashboard-charts"

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.dashboard")

  const nowMs = Date.now() // eslint-disable-line react-hooks/purity -- server component
  const thirtyDaysAgo = new Date(nowMs - THIRTY_DAYS_MS)

  const [profile, recentCheckIns, trendCheckIns, totalResult, dbUser, activeEnrollment] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, session.user.id),
      orderBy: [desc(checkIns.createdAt)],
      limit: RECENT_CHECK_INS_LIMIT,
    }),
    db.query.checkIns.findMany({
      where: and(
        eq(checkIns.userId, session.user.id),
        gte(checkIns.createdAt, thirtyDaysAgo)
      ),
      orderBy: [asc(checkIns.createdAt)],
      columns: {
        createdAt: true,
        mood: true,
        energyLevel: true,
        sleepHours: true,
        symptomFatigue: true,
        symptomBrainFog: true,
        symptomPain: true,
        stressLevel: true,
        pemFlag: true,
      },
    }),
    db.select({ value: count() }).from(checkIns).where(eq(checkIns.userId, session.user.id)),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { emailVerified: true },
    }),
    db.query.programEnrollments.findFirst({
      where: and(
        eq(programEnrollments.clientId, session.user.id),
        eq(programEnrollments.status, "active")
      ),
      with: { program: { columns: { id: true, title: true, durationWeeks: true, phaseConfig: true } } },
      orderBy: [desc(programEnrollments.createdAt)],
    }),
  ])

  const totalCheckIns = totalResult[0]?.value ?? 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const checkedInToday = recentCheckIns.length > 0 &&
    new Date(recentCheckIns[0].createdAt) >= todayStart

  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? "greetingMorning" : hour < 17 ? "greetingAfternoon" : "greetingEvening"

  const isOnboarded = ONBOARDING_REQUIRED_FIELDS.every(
    (f) => profile?.[f as keyof typeof profile]
  )

  const completedFields = PROFILE_COMPLETION_FIELDS.filter(
    (f) => profile?.[f as keyof typeof profile]
  ).length
  const completionPct = Math.round((completedFields / PROFILE_COMPLETION_FIELDS.length) * 100)

  const streak = computeStreak(recentCheckIns.map((ci) => new Date(ci.createdAt)))
  const returnNudge = checkedInToday
    ? null
    : computeReturnNudge(recentCheckIns[0]?.createdAt ?? null, streak)
  const weekDelta = computeWeekDelta(trendCheckIns)

  const hasSymptomData = trendCheckIns.some(
    (c) => c.symptomFatigue != null || c.symptomBrainFog != null || c.symptomPain != null || c.stressLevel != null
  )

  const programProgress = activeEnrollment ? computeProgramProgress(activeEnrollment) : null
  const programPct = programProgress?.totalWeeks
    ? Math.round((programProgress.currentWeek / programProgress.totalWeeks) * 100)
    : 0

  const milestoneHit = detectMilestone(totalCheckIns, streak)
  const milestone = milestoneHit
    ? milestoneHit.type === "checkins"
      ? t("milestoneCheckIns", { n: milestoneHit.n })
      : t("milestoneStreak", { n: milestoneHit.n })
    : null

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS) // eslint-disable-line react-hooks/purity -- server component
  const weekCheckInCount = trendCheckIns.filter((ci) => ci.createdAt >= sevenDaysAgo).length
  const insightHit = computeInsight(
    recentCheckIns.slice(0, DASHBOARD_INSIGHT_ENERGY_WINDOW).map((ci) => ci.energyLevel),
    weekCheckInCount,
    weekDelta
  )
  const insight = insightHit
    ? "delta" in insightHit
      ? t(insightHit.key, { delta: insightHit.delta.toFixed(1) })
      : t(insightHit.key)
    : null

  const firstName = session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? ""

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={t(greetingKey, { name: firstName })} description={t("subtitle")} />

      {!dbUser?.emailVerified && <EmailVerificationBanner />}

      <DashboardBanners
        milestone={milestone}
        isOnboarded={isOnboarded}
        completionPct={completionPct}
        checkedInToday={checkedInToday}
        streak={streak}
        lastEnergy={recentCheckIns[0]?.energyLevel ?? null}
        returnNudge={returnNudge}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label={t("totalCheckIns")} value={totalCheckIns} icon={ClipboardList} color="teal" />
        <StatCard
          label={t("lastEnergy")}
          value={recentCheckIns[0] ? `${recentCheckIns[0].energyLevel}/10` : "—"}
          icon={TrendingUp}
          color="slate"
        />
        <StatCard
          label={t("streak")}
          value={streak >= 1 ? t("streakDays", { count: streak }) : "—"}
          icon={Flame}
          color={streak >= 1 ? "teal" : "slate"}
        />
      </div>

      {weekDelta.window.count > 0 && (
        <div className="mb-6">
          <TrendCard delta={weekDelta} namespace="portal.dashboard.trend" />
        </div>
      )}

      {programProgress && (
        <Card className="mb-6 border-teal-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-teal-800">{programProgress.programTitle}</CardTitle>
              <span className="text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full">
                {programProgress.totalWeeks
                  ? t("programWeek", { current: programProgress.currentWeek, total: programProgress.totalWeeks })
                  : t("programWeekOpen", { current: programProgress.currentWeek })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {programProgress.totalWeeks > 0 && (
              <div className="mb-4">
                <ProgressBar value={Math.min(programPct, 100)} track="teal" />
                <p className="text-xs text-slate-400 mt-1">
                  {t("programProgress", { pct: programPct })}
                </p>
              </div>
            )}
            {programProgress.currentPhase ? (
              <div className="bg-teal-50 rounded-lg p-3">
                <p className="text-sm font-medium text-teal-900">{programProgress.currentPhase.title}</p>
                <p className="text-sm text-teal-700 mt-1 leading-relaxed">{programProgress.currentPhase.guidance}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">{t("programNoPhase")}</p>
            )}
          </CardContent>
        </Card>
      )}

      <DashboardCharts
        trendCheckIns={trendCheckIns}
        hasSymptomData={hasSymptomData}
        insight={insight}
        hasRecentCheckIns={recentCheckIns.length > 0}
      />
    </div>
  )
}
