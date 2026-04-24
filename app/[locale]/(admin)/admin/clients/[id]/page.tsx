import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns, programs, programEnrollments, medicationLog, functionalAssessments, techniqueAssignments, techniques, assignments, techniqueLogs } from "@/lib/db/schema"
import { eq, desc, isNull, and, count, inArray, gte } from "drizzle-orm"
import { formatDate, toDateString } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT, SEVEN_DAYS_MS, SERVICES_MAX_LIMIT } from "@/lib/constants"
import { CLIENT_ROLE, STAFF_ROLES } from "@/lib/domain/auth"
import { computeAdherenceByAssignment } from "@/lib/domain/techniques"
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
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function ClientDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const sevenDaysAgo = toDateString(new Date(Date.now() - SEVEN_DAYS_MS))

  const [client, clientCheckIns, checkInCountResult, allPrograms, activeEnrollment, currentMedications, latestAssessment, clientAssignments, allTechniques, currentAssignment, allPractitioners, recentTechniqueLogs] = await Promise.all([
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
    db.query.functionalAssessments.findFirst({
      where: eq(functionalAssessments.userId, id),
      orderBy: [desc(functionalAssessments.assessedAt)],
    }),
    db.query.techniqueAssignments.findMany({
      where: and(eq(techniqueAssignments.clientId, id), eq(techniqueAssignments.isActive, true)),
      with: { technique: true },
      orderBy: [desc(techniqueAssignments.createdAt)],
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
  ])

  if (!client || client.role !== CLIENT_ROLE) notFound()

  const totalCheckIns = checkInCountResult[0]?.count ?? 0
  const profile = client.profile
  const adherenceByAssignment = computeAdherenceByAssignment(clientAssignments, recentTechniqueLogs)

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
            <NewThreadButton clientId={id} />
            <ResetLinkButton userId={id} />
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClientProfileCard profile={profile} />
        <ClientCheckInsCard clientId={id} checkIns={clientCheckIns} totalCheckIns={totalCheckIns} />
      </div>

      <div className="mt-6">
        <PractitionerAssignmentCard
          clientId={id}
          current={currentAssignment}
          practitioners={allPractitioners}
        />
      </div>

      <ClientMedicationsRow currentMedications={currentMedications} latestAssessment={latestAssessment} />

      <div className="mt-6">
        <TechniqueAssignments
          clientId={id}
          assignments={clientAssignments}
          allTechniques={allTechniques}
          adherenceByAssignment={adherenceByAssignment}
        />
      </div>

      <div className="mt-6">
        <SessionNotes clientId={id} />
      </div>

      <div className="mt-6">
        <SessionPrep clientId={id} />
      </div>

      {activeEnrollment && <ClientEnrollmentCard enrollment={activeEnrollment} />}
    </div>
  )
}
