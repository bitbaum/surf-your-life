import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns, programs, programEnrollments, medicationLog, functionalAssessments, techniqueAssignments, techniques, assignments, techniqueLogs, clientAlerts } from "@/lib/db/schema"
import { eq, desc, isNull, and, count, inArray, gte } from "drizzle-orm"
import { formatDate, localDateString, addDaysISO, buildLastNDayStrings } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT, SEVEN_DAYS_MS, SERVICES_MAX_LIMIT, CLIENT_ASSIGNMENTS_MAX, ADMIN_DASHBOARD_ALERTS_PREVIEW, CLIENT_ASSESSMENTS_LIMIT } from "@/lib/constants"
import { CLIENT_ROLE, STAFF_ROLES } from "@/lib/domain/auth"
import { computeAdherenceByAssignment, computeLogsGridByAssignment } from "@/lib/domain/techniques"
import { computeWeekDelta, computeInsight, isComparativeInsight } from "@/lib/domain/check-in"
import { InsightBanner } from "@/components/ui/insight-banner"
import { ResetLinkButton } from "./reset-link-button"
import { NewThreadButton } from "./new-thread-button"
import { EnrollProgramButton } from "./enroll-program-button"
import { SessionPrep } from "./session-prep"
import { SessionNotes } from "./session-notes"
import { TechniqueAssignments } from "./technique-assignments"
import { ClientMedicationsRow } from "./client-medications-row"
import { ClientEnrollmentCard } from "./client-enrollment-card"
import { PractitionerAssignmentCard } from "./practitioner-assignment-card"
import { ClientProfileCard } from "./client-profile-card"
import { ClientCheckInsCard } from "./client-check-ins-card"
import { TrendCard } from "@/components/ui/trend-card"
import { DayCadenceSparkline } from "@/components/ui/day-cadence-sparkline"
import { SymptomsChart } from "@/components/ui/symptoms-chart"
import { SleepChart } from "@/components/ui/sleep-chart"
import { WellnessTrendChart } from "@/components/ui/wellness-trend-chart"
import { ChartCard } from "@/components/ui/chart-card"
import { ClientAlertsCard } from "./client-alerts-card"
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function ClientDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  // 7 calendar days back in clinic-local — matches the user's "last week" perception
  // and keeps adherence scores from being off-by-one at midnight boundaries.
  const sevenDaysAgo = addDaysISO(localDateString(new Date()), -7)

  const [client, clientCheckIns, checkInCountResult, allPrograms, activeEnrollment, currentMedications, assessments, clientAssignments, allTechniques, currentAssignment, allPractitioners, recentTechniqueLogs, unresolvedAlerts, resolvedAlertCountResult] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, id),
      with: { profile: true },
    }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, id),
      orderBy: [desc(checkIns.createdAt)],
      limit: PAGINATION_DEFAULT,
    }),
    db.select({ count: count() }).from(checkIns).where(eq(checkIns.userId, id)),
    db.query.programs.findMany({ orderBy: [desc(programs.createdAt)], limit: SERVICES_MAX_LIMIT }),
    db.query.programEnrollments.findFirst({
      where: eq(programEnrollments.clientId, id),
      with: { program: true },
      orderBy: [desc(programEnrollments.createdAt)],
    }),
    db.query.medicationLog.findMany({
      where: and(eq(medicationLog.userId, id), isNull(medicationLog.endDate)),
      orderBy: [desc(medicationLog.createdAt)],
    }),
    db.query.functionalAssessments.findMany({
      where: eq(functionalAssessments.userId, id),
      orderBy: [desc(functionalAssessments.assessedAt)],
      limit: CLIENT_ASSESSMENTS_LIMIT,
    }),
    db.query.techniqueAssignments.findMany({
      where: and(eq(techniqueAssignments.clientId, id), eq(techniqueAssignments.isActive, true)),
      with: { technique: true },
      orderBy: [desc(techniqueAssignments.createdAt)],
      limit: CLIENT_ASSIGNMENTS_MAX,
    }),
    db.query.techniques.findMany({
      where: eq(techniques.isActive, true),
      orderBy: (t, { asc }) => [asc(t.category), asc(t.name)],
      limit: SERVICES_MAX_LIMIT,
    }),
    db
      .select({
        id: assignments.id,
        practitionerId: assignments.practitionerId,
        practitionerName: users.name,
        practitionerEmail: users.email,
        assignedAt: assignments.assignedAt,
      })
      .from(assignments)
      .innerJoin(users, eq(users.id, assignments.practitionerId))
      .where(and(eq(assignments.clientId, id), eq(assignments.active, true)))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(inArray(users.role, STAFF_ROLES)),
    db.query.techniqueLogs.findMany({
      where: and(
        eq(techniqueLogs.userId, id),
        gte(techniqueLogs.date, sevenDaysAgo)
      ),
      columns: { assignmentId: true, date: true, completedReps: true },
    }),
    db.query.clientAlerts.findMany({
      where: and(eq(clientAlerts.clientId, id), eq(clientAlerts.isResolved, false)),
      orderBy: [desc(clientAlerts.createdAt)],
      limit: ADMIN_DASHBOARD_ALERTS_PREVIEW,
    }),
    db.select({ value: count() }).from(clientAlerts)
      .where(and(eq(clientAlerts.clientId, id), eq(clientAlerts.isResolved, true))),
  ])

  if (!client || client.role !== CLIENT_ROLE) notFound()

  const totalCheckIns = checkInCountResult[0]?.count ?? 0
  const hasAlertHistory = (resolvedAlertCountResult[0]?.value ?? 0) > 0
  const profile = client.profile
  const adherenceByAssignment = computeAdherenceByAssignment(clientAssignments, recentTechniqueLogs)
  const logsGridByAssignment = computeLogsGridByAssignment(recentTechniqueLogs)
  const weekDelta = computeWeekDelta(clientCheckIns)

  // Chart data: oldest-first
  const chartData = [...clientCheckIns].reverse()
  const symptomData = chartData.map((ci) => ({
    createdAt: ci.createdAt,
    symptomFatigue: ci.symptomFatigue,
    symptomBrainFog: ci.symptomBrainFog,
    symptomPain: ci.symptomPain,
    stressLevel: ci.stressLevel,
  }))
  const hasSymptomData = symptomData.some(
    (c) => c.symptomFatigue != null || c.symptomBrainFog != null || c.symptomPain != null || c.stressLevel != null
  )
  const sleepData = chartData.map((ci) => ({ createdAt: ci.createdAt, sleepHours: ci.sleepHours }))
  const sleepCount = sleepData.filter((c) => c.sleepHours != null).length
  const wellnessData = chartData.map((ci) => ({ createdAt: ci.createdAt, mood: ci.mood, energyLevel: ci.energyLevel }))

  const sparkDays = buildLastNDayStrings(7)
  const sparkCheckedIn = new Set(clientCheckIns.map((ci) => localDateString(new Date(ci.createdAt))))
  const sparkPemDays = new Set(
    clientCheckIns
      .filter((ci) => ci.pemFlag === true)
      .map((ci) => localDateString(new Date(ci.createdAt)))
  )
  const sparkCount = sparkDays.filter((d) => sparkCheckedIn.has(d)).length

  const sevenDaysAgoMs = Date.now() - SEVEN_DAYS_MS // eslint-disable-line react-hooks/purity -- server component
  const weekCheckInCount = clientCheckIns.filter(
    (ci) => ci.createdAt.getTime() >= sevenDaysAgoMs
  ).length
  const insightHit = computeInsight(
    clientCheckIns.slice(0, 3).map((ci) => ci.energyLevel),
    weekCheckInCount,
    weekDelta
  )
  const adminInsight = insightHit && isComparativeInsight(insightHit)
    ? "delta" in insightHit
      ? t(`detail.insights.${insightHit.key}`, { delta: insightHit.delta.toFixed(1) })
      : "count" in insightHit
        ? t(`detail.insights.${insightHit.key}`, { count: insightHit.count })
        : t(`detail.insights.${insightHit.key}`)
    : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/clients" className="text-sm text-slate-400 hover:text-slate-600">
          {t("detail.backLink")}
        </Link>
      </div>

      <PageHeader
        title={client.name ?? t("detail.unnamed")}
        description={`${client.email} · ${t("detail.joinedOn", { date: formatDate(client.createdAt) })}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <EnrollProgramButton clientId={id} programs={allPrograms} />
            <Link
              href={`/admin/messages?client=${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              {t("detail.viewMessages")}
            </Link>
            <NewThreadButton clientId={id} />
            <ResetLinkButton userId={id} />
          </div>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClientProfileCard profile={profile} />
          <ClientCheckInsCard clientId={id} checkIns={clientCheckIns} totalCheckIns={totalCheckIns} />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-slate-700">{t("detail.cadence.title")}</span>
            <DayCadenceSparkline
              days={sparkDays}
              checkedIn={sparkCheckedIn}
              pemDays={sparkPemDays}
              hint={t("cadenceHint")}
              dayLabels={{
                missed: t("dotMissed"),
                checkedIn: t("dotCheckedIn"),
                pem: t("dotPem"),
              }}
              size="md"
            />
            <span className="text-xs text-slate-500">
              {t("detail.cadence.daysOfSeven", { count: sparkCount })}
            </span>
          </div>
          {adminInsight && (
            <InsightBanner title={t("detail.insights.title")} body={adminInsight} />
          )}
          {weekDelta.window.count > 0 && (
            <TrendCard delta={weekDelta} namespace="admin.clients.detail.trend" />
          )}
        </div>

        {hasSymptomData && symptomData.length >= 2 && (
          <ChartCard
            title={t("detail.symptomsChart.title")}
            subtitle={t("detail.symptomsChart.subtitle")}
          >
            <SymptomsChart
              data={symptomData}
              labels={{
                fatigue: t("detail.symptomsChart.fatigue"),
                brainFog: t("detail.symptomsChart.brainFog"),
                pain: t("detail.symptomsChart.pain"),
                stress: t("detail.symptomsChart.stress"),
              }}
            />
          </ChartCard>
        )}

        {sleepCount >= 2 && (
          <ChartCard
            title={t("detail.sleepChart.title")}
            subtitle={t("detail.sleepChart.subtitle")}
          >
            <SleepChart
              data={sleepData}
              formatHours={(n) => t("detail.sleepChart.hoursTooltip", { n })}
            />
          </ChartCard>
        )}

        {wellnessData.length >= 2 && (
          <ChartCard
            title={t("detail.wellnessChart.title")}
            subtitle={t("detail.wellnessChart.subtitle")}
          >
            <WellnessTrendChart
              data={wellnessData}
              labels={{
                mood: t("detail.wellnessChart.mood"),
                energy: t("detail.wellnessChart.energy"),
              }}
            />
          </ChartCard>
        )}

        {(unresolvedAlerts.length > 0 || hasAlertHistory) && (
          <ClientAlertsCard initialAlerts={unresolvedAlerts} clientId={id} hasHistory={hasAlertHistory} />
        )}

        <PractitionerAssignmentCard
          clientId={id}
          current={currentAssignment}
          practitioners={allPractitioners}
        />

        <ClientMedicationsRow currentMedications={currentMedications} assessments={assessments} />

        <TechniqueAssignments
          clientId={id}
          assignments={clientAssignments}
          allTechniques={allTechniques}
          adherenceByAssignment={adherenceByAssignment}
          logsGridByAssignment={logsGridByAssignment}
        />

        <SessionNotes clientId={id} />

        <SessionPrep clientId={id} />

        {activeEnrollment && <ClientEnrollmentCard enrollment={activeEnrollment} />}
      </div>
    </div>
  )
}
