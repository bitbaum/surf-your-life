import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, profiles, users, programEnrollments } from "@/lib/db/schema"
import { eq, desc, asc, and, gte, count } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { ClipboardList, TrendingUp, Flame, CheckCircle2 } from "lucide-react"
import {
  ONBOARDING_REQUIRED_FIELDS,
  PROFILE_COMPLETION_FIELDS,
  RECENT_CHECK_INS_LIMIT,
  THIRTY_DAYS_MS,
  DAY_MS,
  SEVEN_DAYS_MS,
} from "@/lib/constants"
import { WellnessTrendChart } from "./wellness-trend-chart"
import { SleepChart } from "./sleep-chart"
import { SymptomsChart } from "./symptoms-chart"
import { EmailVerificationBanner } from "@/components/portal/EmailVerificationBanner"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.dashboard")

  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS)

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

  // Has the user already checked in today?
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const checkedInToday = recentCheckIns.length > 0 &&
    new Date(recentCheckIns[0].createdAt) >= todayStart

  // Time-of-day greeting
  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? "greetingMorning" : hour < 17 ? "greetingAfternoon" : "greetingEvening"

  const isOnboarded = ONBOARDING_REQUIRED_FIELDS.every(
    (f) => profile?.[f as keyof typeof profile]
  )

  const completedFields = PROFILE_COMPLETION_FIELDS.filter(
    (f) => profile?.[f as keyof typeof profile]
  ).length
  const completionPct = Math.round((completedFields / PROFILE_COMPLETION_FIELDS.length) * 100)

  // Current streak: consecutive days with a check-in ending today/yesterday
  const streak = (() => {
    if (recentCheckIns.length === 0) return 0
    const days = recentCheckIns.map((ci) => {
      const d = new Date(ci.createdAt)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    })
    const unique = [...new Set(days)].sort((a, b) => b - a)
    const today = new Date()
    const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    let s = 0
    let expected = todayMs
    // Allow streak to start from yesterday if not yet checked in today
    if (unique[0] !== todayMs && unique[0] !== todayMs - DAY_MS) return 0
    if (unique[0] === todayMs - DAY_MS) expected = todayMs - DAY_MS
    for (const d of unique) {
      if (d === expected) { s++; expected -= DAY_MS }
      else break
    }
    return s
  })()

  const hasSymptomData = trendCheckIns.some(
    (c) => c.symptomFatigue != null || c.symptomBrainFog != null || c.symptomPain != null || c.stressLevel != null
  )

  // Programme progress — current week and active phase
  type PhaseEntry = { week: number; title: string; guidance: string }
  const programProgress = (() => {
    if (!activeEnrollment?.startDate) return null
    const startMs = activeEnrollment.startDate.getTime()
    const currentWeek = Math.floor((Date.now() - startMs) / (7 * DAY_MS)) + 1
    const totalWeeks = activeEnrollment.program.durationWeeks ?? 0
    if (currentWeek < 1 || (totalWeeks > 0 && currentWeek > totalWeeks)) return null
    const phases = activeEnrollment.program.phaseConfig as PhaseEntry[] | null
    const currentPhase = phases?.find((p) => p.week === currentWeek) ?? null
    return { currentWeek, totalWeeks, currentPhase, programTitle: activeEnrollment.program.title }
  })()

  // Milestone detection — check-in count milestones and streak milestones
  const CHECKIN_MILESTONES = [10, 25, 50, 100, 250, 500]
  const STREAK_MILESTONES = [7, 14, 30, 60, 100]
  const checkInMilestone = CHECKIN_MILESTONES.find((m) => totalCheckIns === m)
  const streakMilestone = STREAK_MILESTONES.find((m) => streak === m)
  const milestone = checkInMilestone
    ? t("milestoneCheckIns", { n: checkInMilestone })
    : streakMilestone
    ? t("milestoneStreak", { n: streakMilestone })
    : null

  // Rule-based insight: simple trend text based on recent check-ins
  const insight = (() => {
    if (recentCheckIns.length < 3) return null
    const last3Energy = recentCheckIns.slice(0, 3).map((ci) => ci.energyLevel)
    const trend = last3Energy[0] - last3Energy[2]
    if (trend >= 2) return t("insightEnergyUp")
    if (trend <= -2) return t("insightEnergyDown")
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
    const weekCheckIns = trendCheckIns.filter((ci) => ci.createdAt >= sevenDaysAgo)
    if (weekCheckIns.length >= 5) return t("insightConsistent")
    return null
  })()

  const firstName = session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? ""

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {t(greetingKey, { name: firstName })}
        </h1>
        <p className="text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      {!dbUser?.emailVerified && <EmailVerificationBanner />}

      {milestone && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">{t("milestoneTitle")}</p>
            <p className="text-xs text-amber-700 mt-0.5">{milestone}</p>
          </div>
        </div>
      )}

      {!isOnboarded && (
        <div className="mb-6 rounded-xl bg-teal-50 border border-teal-200 p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="font-medium text-teal-900 text-sm">{t("completeProfile")}</p>
              <p className="text-xs text-teal-700 mt-0.5">
                {t("completeProfileBody", { pct: completionPct })}
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm">{t("completeProfileCta")}</Button>
            </Link>
          </div>
          <div className="h-1.5 rounded-full bg-teal-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-500 transition-all"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Today's check-in status banner */}
      {checkedInToday ? (
        <div className="mb-6 rounded-xl bg-teal-50 border border-teal-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal-900">{t("checkedInTodayTitle")}</p>
            <p className="text-xs text-teal-700 mt-0.5">{t("checkedInTodayBody")}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t("readyTitle")}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t("readySubtitle")}</p>
          </div>
          <Link href="/check-in">
            <Button size="sm">{t("checkIn")}</Button>
          </Link>
        </div>
      )}

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
          value={streak >= 2 ? `${streak} ${t("days")}` : "—"}
          icon={Flame}
          color={streak >= 2 ? "teal" : "slate"}
        />
      </div>

      {programProgress && (
        <Card className="mb-6 border-teal-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-teal-800">{programProgress.programTitle}</CardTitle>
              <span className="text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full">
                {t("programWeek", { current: programProgress.currentWeek, total: programProgress.totalWeeks || "?" })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {programProgress.totalWeeks > 0 && (
              <div className="mb-4">
                <div className="h-2 rounded-full bg-teal-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${Math.min((programProgress.currentWeek / programProgress.totalWeeks) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t("programProgress", { pct: Math.round((programProgress.currentWeek / programProgress.totalWeeks) * 100) })}
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

      {trendCheckIns.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("wellnessTrend")}</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">{t("wellnessTrendSubtitle")}</p>
              </div>
              <Link href="/check-ins" className="text-sm text-teal-600 hover:underline shrink-0">
                {t("viewAll")}
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <WellnessTrendChart data={trendCheckIns} />
          </CardContent>
        </Card>
      )}

      {trendCheckIns.filter((c) => c.sleepHours != null).length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("sleepTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SleepChart data={trendCheckIns} />
            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              <span>{formatDate(trendCheckIns[0].createdAt)}</span>
              <span>{formatDate(trendCheckIns[trendCheckIns.length - 1].createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSymptomData && trendCheckIns.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("symptomsTitle")}</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">{t("symptomsSubtitle")}</p>
          </CardHeader>
          <CardContent>
            <SymptomsChart data={trendCheckIns} />
          </CardContent>
        </Card>
      )}

      {insight && (
        <Card className="mb-6 bg-teal-50 border-teal-200">
          <CardContent className="pt-5 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-sm font-medium text-teal-900">{t("insightTitle")}</p>
              <p className="text-sm text-teal-700 mt-0.5">{insight}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {recentCheckIns.length > 0 && (
        <div className="flex justify-center">
          <Link href="/check-ins" className="text-sm text-slate-400 hover:text-teal-600 transition-colors">
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  )
}
