import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, users, programEnrollments } from "@/lib/db/schema"
import { getUserProfile } from "@/lib/db/queries"
import { eq, desc, asc, and, gte, count, isNotNull } from "drizzle-orm"
import { localDateString } from "@/lib/utils"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { StatCard } from "@/components/ui/stat-card"
import { ClipboardList, TrendingUp, Flame } from "lucide-react"
import {
  ONBOARDING_REQUIRED_FIELDS,
  PROFILE_COMPLETION_FIELDS,
  RECENT_CHECK_INS_LIMIT,
  THIRTY_DAYS_MS,
  SEVEN_DAYS_MS,
  DASHBOARD_INSIGHT_ENERGY_WINDOW,
  CLINIC_TZ,
} from "@/lib/constants"
import {
  computeStreak,
  computeProgramProgress,
  computeReturnNudge,
  computeWeekDelta,
  detectMilestone,
  computeInsight,
} from "@/lib/domain/check-in"
import { EmailVerificationBanner } from "@/components/portal/EmailVerificationBanner"
import { PageHeader } from "@/components/ui/page-header"
import { DashboardBanners } from "./dashboard-banners"
import { DashboardCharts } from "./dashboard-charts"
import { DashboardSparklineRow } from "./dashboard-sparkline-row"
import { DashboardProgramCard } from "./dashboard-program-card"
import { DashboardTechniquesCard } from "./dashboard-techniques-card"
import { DashboardPractitionerNoteCard } from "./dashboard-practitioner-note-card"
import { DashboardPractitionerCard } from "./dashboard-practitioner-card"
import { DashboardAIInsightCard } from "./dashboard-ai-insight-card"

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.dashboard")

  const nowMs = Date.now() // eslint-disable-line react-hooks/purity -- server component
  const thirtyDaysAgo = new Date(nowMs - THIRTY_DAYS_MS)

  const [profile, recentCheckIns, trendCheckIns, totalResult, dbUser, activeEnrollment, latestAIInsight] = await Promise.all([
    getUserProfile(session.user.id),
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
    db.query.checkIns.findFirst({
      where: and(eq(checkIns.userId, session.user.id), isNotNull(checkIns.aiInsight)),
      orderBy: [desc(checkIns.createdAt)],
      columns: { aiInsight: true, createdAt: true },
    }),
  ])

  const totalCheckIns = totalResult[0]?.value ?? 0

  const todayStr = localDateString(new Date())
  const checkedInToday = recentCheckIns.length > 0 &&
    localDateString(new Date(recentCheckIns[0].createdAt)) === todayStr

  const zurichHour = parseInt(new Intl.DateTimeFormat("en", { timeZone: CLINIC_TZ, hour: "numeric", hour12: false }).format(new Date()), 10)
  const greetingKey = zurichHour < 12 ? "greetingMorning" : zurichHour < 17 ? "greetingAfternoon" : "greetingEvening"

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
      : "count" in insightHit
        ? t(insightHit.key, { count: insightHit.count })
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

      <DashboardSparklineRow recentCheckIns={recentCheckIns} weekDelta={weekDelta} />

      <DashboardPractitionerCard userId={session.user.id} />
      <DashboardPractitionerNoteCard userId={session.user.id} />

      <DashboardAIInsightCard insight={latestAIInsight?.aiInsight ?? null} generatedAt={latestAIInsight?.createdAt ?? null} />

      <DashboardProgramCard programProgress={programProgress} />

      <DashboardTechniquesCard userId={session.user.id} />

      <DashboardCharts
        trendCheckIns={trendCheckIns}
        hasSymptomData={hasSymptomData}
        insight={insight}
        hasRecentCheckIns={recentCheckIns.length > 0}
      />
    </div>
  )
}
