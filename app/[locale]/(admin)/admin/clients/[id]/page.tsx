import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns, programs, programEnrollments, medicationLog, functionalAssessments, techniqueAssignments, techniques } from "@/lib/db/schema"
import { eq, desc, isNull, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { MOOD_EMOJI, PAGINATION_DEFAULT } from "@/lib/constants"
import { ResetLinkButton } from "./reset-link-button"
import { NewThreadButton } from "./new-thread-button"
import { EnrollProgramButton } from "./enroll-program-button"
import { CheckInNote } from "./check-in-note"
import { SessionPrep } from "./session-prep"
import { SessionNotes } from "./session-notes"
import { TechniqueAssignments } from "./technique-assignments"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function ClientDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const [client, clientCheckIns, allPrograms, activeEnrollment, currentMedications, latestAssessment, clientAssignments, allTechniques] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, id),
      with: { profile: true },
    }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, id),
      orderBy: [desc(checkIns.createdAt)],
      limit: PAGINATION_DEFAULT,
    }),
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
                <Row label={t("detail.exercise")} value={profile.exerciseFrequency} />
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
            <CardTitle>{t("detail.checkInsCard")} ({clientCheckIns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {clientCheckIns.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {clientCheckIns.map((ci) => (
                  <div key={ci.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                        <span>{MOOD_EMOJI[ci.mood] ?? "😐"}</span>
                        {formatEnumValue(ci.mood)}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(ci.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                      <span>{t("detail.energy")}: <strong className="text-slate-700">{ci.energyLevel}/10</strong></span>
                      {ci.sleepHours != null && <span>{t("detail.sleep")}: <strong className="text-slate-700">{ci.sleepHours}h</strong></span>}
                      {ci.activityLevel && <span>{t("detail.activityLevel")}: <strong className="text-slate-700">{ci.activityLevel}</strong></span>}
                      {ci.sleepQuality != null && <span>{t("detail.sleepQuality")}: <strong className="text-slate-700">{ci.sleepQuality}/5</strong></span>}
                      {ci.pemFlag && (
                        <span className="text-red-600 font-medium">
                          {t("detail.pem")}{ci.pemSeverity ? ` ${ci.pemSeverity}/10` : ""}
                        </span>
                      )}
                      {ci.orthostaticSymptoms && (
                        <span className="text-orange-600 font-medium">{t("detail.orthostatic")}</span>
                      )}
                    </div>
                    {(ci.symptomFatigue != null || ci.symptomBrainFog != null || ci.symptomPain != null || ci.stressLevel != null) && (
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1">
                        {ci.symptomFatigue != null && <span>{t("detail.fatigue")}: <strong>{ci.symptomFatigue}</strong></span>}
                        {ci.symptomBrainFog != null && <span>{t("detail.brainFog")}: <strong>{ci.symptomBrainFog}</strong></span>}
                        {ci.symptomPain != null && <span>{t("detail.pain")}: <strong>{ci.symptomPain}</strong></span>}
                        {ci.stressLevel != null && <span>{t("detail.stress")}: <strong>{ci.stressLevel}</strong></span>}
                      </div>
                    )}
                    {ci.journalEntry && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ci.journalEntry}</p>}
                    {!ci.journalEntry && ci.wins && <p className="text-xs text-teal-700 mt-1">✓ {ci.wins}</p>}
                    {!ci.journalEntry && ci.challenges && <p className="text-xs text-slate-500 mt-1 italic">{ci.challenges}</p>}
                    {!ci.journalEntry && ci.notes && <p className="text-xs text-slate-400 mt-1">{ci.notes}</p>}
                    {ci.aiInsight && (
                      <div className="mt-2 p-2 bg-violet-50 border border-violet-100 rounded-lg">
                        <p className="text-xs text-violet-500 font-medium mb-0.5">{t("detail.aiInsight")}</p>
                        <p className="text-xs text-violet-800 leading-relaxed">{ci.aiInsight}</p>
                      </div>
                    )}
                    <CheckInNote
                      checkInId={ci.id}
                      existingNote={ci.practitionerNote ?? null}
                      existingNoteAt={ci.practitionerNoteAt ?? null}
                    />
                  </div>
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
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  activeEnrollment.status === "active"
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : activeEnrollment.status === "paused"
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  {activeEnrollment.status}
                </span>
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
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-400 rounded-full"
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  )
}
