import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, profiles, users } from "@/lib/db/schema"
import { eq, desc, asc, and, gte, count } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { ClipboardList, TrendingUp, Flame } from "lucide-react"
import { ONBOARDING_REQUIRED_FIELDS, PROFILE_COMPLETION_FIELDS, MOOD_EMOJI } from "@/lib/constants"
import { WellnessTrendChart } from "./wellness-trend-chart"
import { SleepChart } from "./sleep-chart"
import { EmailVerificationBanner } from "@/components/portal/EmailVerificationBanner"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.dashboard")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [profile, recentCheckIns, trendCheckIns, totalResult, dbUser] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, session.user.id),
      orderBy: [desc(checkIns.createdAt)],
      limit: 5,
    }),
    db.query.checkIns.findMany({
      where: and(
        eq(checkIns.userId, session.user.id),
        gte(checkIns.createdAt, thirtyDaysAgo)
      ),
      orderBy: [asc(checkIns.createdAt)],
      columns: { createdAt: true, mood: true, energyLevel: true, sleepHours: true },
    }),
    db.select({ value: count() }).from(checkIns).where(eq(checkIns.userId, session.user.id)),
    db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { emailVerified: true },
    }),
  ])

  const totalCheckIns = totalResult[0]?.value ?? 0

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
    const DAY = 86400000
    let s = 0
    let expected = todayMs
    // Allow streak to start from yesterday if not yet checked in today
    if (unique[0] !== todayMs && unique[0] !== todayMs - DAY) return 0
    if (unique[0] === todayMs - DAY) expected = todayMs - DAY
    for (const d of unique) {
      if (d === expected) { s++; expected -= DAY }
      else break
    }
    return s
  })()

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("title", { name: session.user.name?.split(" ")[0] ?? session.user.email?.split("@")[0] ?? "" })}
        description={t("subtitle")}
      />

      {!dbUser?.emailVerified && <EmailVerificationBanner />}

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label={t("totalCheckIns")} value={totalCheckIns} icon={ClipboardList} color="teal" />
        <StatCard
          label={t("lastEnergy")}
          value={recentCheckIns[0] ? `${recentCheckIns[0].energyLevel}/10` : "—"}
          icon={TrendingUp}
          color="slate"
        />
        {streak >= 2 ? (
          <StatCard
            label={t("streak")}
            value={`${streak} ${t("days")}`}
            icon={Flame}
            color="teal"
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">{t("readyTitle")}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t("readySubtitle")}</p>
            </div>
            <Link href="/check-in">
              <Button size="sm">{t("checkIn")}</Button>
            </Link>
          </div>
        )}
      </div>

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

      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("recentCheckIns")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-slate-100">
              {recentCheckIns.map((ci) => (
                <div key={ci.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {MOOD_EMOJI[ci.mood]} {formatEnumValue(ci.mood)}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(ci.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{t("energy")}</span>
                    <span className="text-sm font-semibold text-teal-700">{ci.energyLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
