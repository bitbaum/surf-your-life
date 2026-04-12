import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, profiles } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { ClipboardList, User, TrendingUp } from "lucide-react"
import { ONBOARDING_REQUIRED_FIELDS, ENERGY_SCALE } from "@/lib/constants"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const [profile, recentCheckIns] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.user.id) }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, session.user.id),
      orderBy: [desc(checkIns.createdAt)],
      limit: 7,
    }),
  ])

  const isOnboarded = ONBOARDING_REQUIRED_FIELDS.every(
    (f) => profile?.[f as keyof typeof profile]
  )

  // Trend: last 7 check-ins in chronological order for the sparkline
  const trend = [...recentCheckIns].reverse()

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={`Welcome back, ${session.user.name?.split(" ")[0]}`}
        description="Here's how your journey is going"
      />

      {!isOnboarded && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <User className="w-4 h-4 text-teal-700" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-teal-900">Complete your profile</p>
            <p className="text-sm text-teal-700 mt-0.5">
              Tell us about your situation so we can tailor your experience.
            </p>
          </div>
          <Link href="/profile">
            <Button size="sm">Complete profile</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total check-ins" value={recentCheckIns.length} icon={ClipboardList} color="teal" />
        <StatCard
          label="Last energy level"
          value={recentCheckIns[0] ? `${recentCheckIns[0].energyLevel}/10` : "—"}
          icon={TrendingUp}
          color="blue"
        />
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Ready for today?</p>
            <p className="text-xs text-slate-400 mt-0.5">Track your day</p>
          </div>
          <Link href="/check-in">
            <Button size="sm">Check in</Button>
          </Link>
        </div>
      </div>

      {trend.length >= 2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Energy trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-16">
              {trend.map((ci) => {
                const pct = ((ci.energyLevel - ENERGY_SCALE.min) / (ENERGY_SCALE.max - ENERGY_SCALE.min)) * 100
                return (
                  <div key={ci.id} className="flex flex-col items-center gap-1 flex-1" title={`Energy ${ci.energyLevel}/10 — ${formatDate(ci.createdAt)}`}>
                    <div
                      className="w-full rounded-t bg-teal-500 transition-all"
                      style={{ height: `${Math.max(pct, 8)}%` }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
              <span>{formatDate(trend[0].createdAt)}</span>
              <span>{formatDate(trend[trend.length - 1].createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent check-ins</CardTitle>
              <Link href="/check-ins" className="text-sm text-teal-600 hover:underline">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-slate-100">
              {recentCheckIns.slice(0, 5).map((ci) => (
                <div key={ci.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{formatEnumValue(ci.mood)}</p>
                    <p className="text-xs text-slate-400">{formatDate(ci.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Energy</span>
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
