import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns, programs, programEnrollments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import { MOOD_EMOJI } from "@/lib/constants"
import { ResetLinkButton } from "./reset-link-button"
import { NewThreadButton } from "./new-thread-button"
import { EnrollProgramButton } from "./enroll-program-button"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function ClientDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const [client, clientCheckIns, allPrograms, activeEnrollment] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, id),
      with: { profile: true },
    }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, id),
      orderBy: [desc(checkIns.createdAt)],
      limit: 20,
    }),
    db.query.programs.findMany({ orderBy: [desc(programs.createdAt)] }),
    db.query.programEnrollments.findFirst({
      where: eq(programEnrollments.clientId, id),
      with: { program: true },
      orderBy: [desc(programEnrollments.createdAt)],
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
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>{t("detail.energy")}: <strong className="text-slate-700">{ci.energyLevel}/10</strong></span>
                      {ci.sleepHours != null && <span>{t("detail.sleep")}: <strong className="text-slate-700">{ci.sleepHours}h</strong></span>}
                    </div>
                    {ci.wins && <p className="text-xs text-teal-700 mt-1">✓ {ci.wins}</p>}
                    {ci.challenges && <p className="text-xs text-slate-500 mt-1 italic">{ci.challenges}</p>}
                    {ci.notes && <p className="text-xs text-slate-400 mt-1">{ci.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">{t("detail.noCheckIns")}</p>
            )}
          </CardContent>
        </Card>
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
