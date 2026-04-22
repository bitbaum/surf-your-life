import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns, programs, programEnrollments, medicationLog, functionalAssessments, techniqueAssignments, techniques, assignments } from "@/lib/db/schema"
import { eq, desc, isNull, and, count, inArray } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatEnumValue } from "@/lib/utils"

import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { CLIENT_ROLE, STAFF_ROLES } from "@/lib/domain/auth"
import { ResetLinkButton } from "./reset-link-button"
import { NewThreadButton } from "./new-thread-button"
import { EnrollProgramButton } from "./enroll-program-button"
import { CheckInRow } from "./check-in-row"
import { SessionPrep } from "./session-prep"
import { SessionNotes } from "./session-notes"
import { TechniqueAssignments } from "./technique-assignments"
import { ClientMedicationsRow } from "./client-medications-row"
import { ClientEnrollmentCard } from "./client-enrollment-card"
import { PractitionerAssignmentCard } from "./practitioner-assignment-card"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function ClientDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const [client, clientCheckIns, checkInCountResult, allPrograms, activeEnrollment, currentMedications, latestAssessment, clientAssignments, allTechniques, currentAssignment, allPractitioners] = await Promise.all([
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
    db.query.programs.findMany({ orderBy: [desc(programs.createdAt)] }),
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
  ])

  if (!client || client.role !== CLIENT_ROLE) notFound()

  const totalCheckIns = checkInCountResult[0]?.count ?? 0
  const profile = client.profile

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/clients" className="text-sm text-slate-400 hover:text-slate-600">
          {t("detail.backLink")}
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{client.name ?? t("detail.unnamed")}</h1>
          <p className="text-slate-500">{client.email} · {t("detail.joinedOn", { date: formatDate(client.createdAt) })}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EnrollProgramButton clientId={id} programs={allPrograms} />
          <NewThreadButton clientId={id} />
          <ResetLinkButton userId={id} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t("detail.profileCard")}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {profile ? (
              <>
                <Row label={t("detail.mainConcern")} value={profile.mainConcern ? formatEnumValue(profile.mainConcern) : undefined} />
                <Row label={t("detail.occupation")} value={profile.occupation} />
                <Row label={t("detail.dateOfBirth")} value={profile.dateOfBirth} />
                <Row label={t("detail.exercise")} value={profile.exerciseFrequency ? formatEnumValue(profile.exerciseFrequency) : undefined} />
                <Row label={t("detail.previousTherapy")} value={profile.previousTherapy ? t("detail.yes") : t("detail.no")} />
                <Row label={t("detail.sleepQuality")} value={profile.sleepQuality ? `${profile.sleepQuality}/10` : undefined} />
                <Row label={t("detail.stressLevel")} value={profile.stressLevel ? `${profile.stressLevel}/10` : undefined} />
                <Row label={t("detail.medications")} value={profile.medications} />
                {profile.currentSituation && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">{t("detail.currentSituation")}</p>
                    <p className="text-slate-700 leading-relaxed">{profile.currentSituation}</p>
                  </div>
                )}
                {profile.goals && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">{t("detail.goals")}</p>
                    <p className="text-slate-700 leading-relaxed">{profile.goals}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-400">{t("detail.noProfile")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>
                {t("detail.checkInsCard")} ({totalCheckIns})
                {totalCheckIns > PAGINATION_DEFAULT && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    {t("detail.showingRecent", { n: PAGINATION_DEFAULT })}
                  </span>
                )}
              </span>
              {totalCheckIns > PAGINATION_DEFAULT && (
                <Link
                  href={`/admin/clients/${id}/check-ins`}
                  className="text-xs font-normal text-teal-600 hover:underline"
                >
                  {t("detail.viewAllCheckIns")}
                </Link>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientCheckIns.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {clientCheckIns.map((ci) => (
                  <CheckInRow key={ci.id} ci={ci} />
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">{t("detail.noCheckIns")}</p>
            )}
          </CardContent>
        </Card>
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

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-400 flex-shrink-0">{label}</span>
      <span className="text-slate-700 capitalize text-right">{value}</span>
    </div>
  )
}
