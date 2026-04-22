import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns, programs, programEnrollments, medicationLog, functionalAssessments, techniqueAssignments, techniques } from "@/lib/db/schema"
import { eq, desc, isNull, and, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { ResetLinkButton } from "./reset-link-button"
import { NewThreadButton } from "./new-thread-button"
import { EnrollProgramButton } from "./enroll-program-button"
import { CheckInRow } from "./check-in-row"
import { SessionPrep } from "./session-prep"
import { SessionNotes } from "./session-notes"
import { TechniqueAssignments } from "./technique-assignments"
import { EnrollmentStatus } from "../../programs/[id]/enrollment-status"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function ClientDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const [client, clientCheckIns, checkInCountResult, allPrograms, activeEnrollment, currentMedications, latestAssessment, clientAssignments, allTechniques] = await Promise.all([
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
  ])

  if (!client || client.role !== "client") notFound()

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

      {/* Medications + Assessment row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.medicationsCard")}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentMedications.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {currentMedications.map((med) => (
                  <div key={med.id} className="py-2.5">
                    <p className="text-sm font-medium text-slate-800">{med.medicationName}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-0.5">
                      {med.dose && <span>{med.dose}</span>}
                      {med.frequency && <span>· {med.frequency}</span>}
                      {med.startDate && <span>· {t("detail.since")} {med.startDate}</span>}
                    </div>
                    {med.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{med.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">{t("detail.noMedications")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.assessmentCard")}</CardTitle>
          </CardHeader>
          <CardContent>
            {latestAssessment ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-teal-600">{latestAssessment.overallCapacity}<span className="text-lg text-slate-400">/10</span></span>
                  <span className="text-xs text-slate-400">{formatDate(latestAssessment.assessedAt)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {latestAssessment.cognitiveCapacity != null && (
                    <CapacityBar label={t("detail.cognitive")} value={latestAssessment.cognitiveCapacity} />
                  )}
                  {latestAssessment.physicalCapacity != null && (
                    <CapacityBar label={t("detail.physical")} value={latestAssessment.physicalCapacity} />
                  )}
                  {latestAssessment.emotionalCapacity != null && (
                    <CapacityBar label={t("detail.emotional")} value={latestAssessment.emotionalCapacity} />
                  )}
                  {latestAssessment.socialCapacity != null && (
                    <CapacityBar label={t("detail.social")} value={latestAssessment.socialCapacity} />
                  )}
                </div>
                {latestAssessment.notes && (
                  <p className="text-xs text-slate-500 italic leading-relaxed">{latestAssessment.notes}</p>
                )}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">{t("detail.noAssessment")}</p>
            )}
          </CardContent>
        </Card>
      </div>

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

      {activeEnrollment && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.programCard")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/admin/programs/${activeEnrollment.programId}`}
                    className="font-medium text-slate-900 hover:text-teal-600 transition-colors"
                  >
                    {activeEnrollment.program.title}
                  </Link>
                  <div className="flex flex-wrap gap-3 mt-1 text-slate-500">
                    {activeEnrollment.startDate && (
                      <span>{t("detail.startedOn", { date: formatDate(activeEnrollment.startDate) })}</span>
                    )}
                    {activeEnrollment.program.durationWeeks && (
                      <span>{activeEnrollment.program.durationWeeks} {t("detail.weeks")}</span>
                    )}
                  </div>
                  {activeEnrollment.notes && (
                    <p className="text-slate-500 mt-2 italic">{activeEnrollment.notes}</p>
                  )}
                </div>
                <EnrollmentStatus
                  enrollmentId={activeEnrollment.id}
                  currentStatus={activeEnrollment.status}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
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

function CapacityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-medium text-slate-700">{value}/10</span>
      </div>
      <ProgressBar value={value * 10} size="sm" />
    </div>
  )
}
