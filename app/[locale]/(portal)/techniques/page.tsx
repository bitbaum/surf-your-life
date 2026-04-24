import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { techniqueAssignments, techniqueLogs } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { PageHeader } from "@/components/ui/page-header"
import { TechniqueTracker } from "./technique-tracker"
import type { LogByDate } from "@/lib/domain/techniques"
import { toDateString } from "@/lib/utils"
import { DAY_MS, TECHNIQUE_LOG_WINDOW_DAYS, CLIENT_ASSIGNMENTS_MAX } from "@/lib/constants"

export default async function TechniquesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.techniques")

  const nowMs = Date.now() // eslint-disable-line react-hooks/purity -- server component
  const today = toDateString(new Date(nowMs))
  // Fetch logs for debt window
  const since = toDateString(new Date(nowMs - TECHNIQUE_LOG_WINDOW_DAYS * DAY_MS))

  const [assignments, logs] = await Promise.all([
    db.query.techniqueAssignments.findMany({
      where: and(
        eq(techniqueAssignments.clientId, session.user.id),
        eq(techniqueAssignments.isActive, true)
      ),
      with: { technique: true },
      orderBy: (a, { asc }) => [asc(a.createdAt)],
      limit: CLIENT_ASSIGNMENTS_MAX,
    }),
    db.query.techniqueLogs.findMany({
      where: and(
        eq(techniqueLogs.userId, session.user.id),
        gte(techniqueLogs.date, since)
      ),
    }),
  ])

  // Build logsByAssignment: assignmentId → { date → completedReps }
  // Each tap inserts a new row with completedReps = cumulative total so far that day.
  // Take MAX to get the actual reps done without double-counting earlier rows.
  const logsByAssignment: Record<string, LogByDate> = {}
  for (const log of logs) {
    if (!logsByAssignment[log.assignmentId]) logsByAssignment[log.assignmentId] = {}
    const existing = logsByAssignment[log.assignmentId][log.date] ?? 0
    logsByAssignment[log.assignmentId][log.date] = Math.max(existing, log.completedReps)
  }

  const totalToday = assignments.reduce((sum, a) => {
    const done = logsByAssignment[a.id]?.[today] ?? 0
    return sum + (done >= a.frequencyPerDay ? 1 : 0)
  }, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={t("title")}
        description={
          assignments.length > 0
            ? t("progress", { done: totalToday, total: assignments.length })
            : t("description")
        }
      />

      <TechniqueTracker
        assignments={assignments}
        logsByAssignment={logsByAssignment}
        today={today}
      />
    </div>
  )
}
