import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { programEnrollments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { SEVEN_DAYS_MS } from "@/lib/constants"
import { CheckCircle, Clock, Pause } from "lucide-react"
import { PhaseTimeline } from "./phase-timeline"

export default async function ProgramPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.program")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const enrollment = await db.query.programEnrollments.findFirst({
    where: eq(programEnrollments.clientId, session.user.id),
    with: { program: true },
    orderBy: [desc(programEnrollments.createdAt)],
  })

  if (!enrollment) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title={t("title")} description={t("noProgram")} />
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">{t("noProgramDescription")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { program } = enrollment

  // Calculate progress if start date is set
  const nowMs = Date.now() // eslint-disable-line react-hooks/purity -- server component
  const weeksCompleted = enrollment.startDate
    ? Math.floor((nowMs - new Date(enrollment.startDate).getTime()) / SEVEN_DAYS_MS)
    : null
  const currentWeek =
    weeksCompleted !== null && program.durationWeeks
      ? Math.min(weeksCompleted + 1, program.durationWeeks)
      : null
  const progressPct =
    currentWeek && program.durationWeeks
      ? Math.round((currentWeek / program.durationWeeks) * 100)
      : null

  const statusIcon = {
    active: <CheckCircle className="w-4 h-4 text-teal-600" />,
    paused: <Pause className="w-4 h-4 text-yellow-600" />,
    completed: <CheckCircle className="w-4 h-4 text-slate-500" />,
  }[enrollment.status]

  const statusStyle = {
    active: "bg-teal-50 text-teal-700 border border-teal-200",
    paused: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    completed: "bg-slate-100 text-slate-600 border border-slate-200",
  }[enrollment.status]

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("title")} description={program.title} />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{program.title}</CardTitle>
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle}`}>
                {statusIcon}
                {t(`status.${enrollment.status}`)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {program.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{program.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {program.durationWeeks && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-400 mb-1">{t("duration")}</p>
                  <p className="font-semibold text-slate-900">{program.durationWeeks} {t("weeks")}</p>
                </div>
              )}
              {enrollment.startDate && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-400 mb-1">{t("startDate")}</p>
                  <p className="font-semibold text-slate-900">{formatDate(enrollment.startDate)}</p>
                </div>
              )}
              {program.targetConcern && (
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-400 mb-1">{t("focus")}</p>
                  <p className="font-semibold text-slate-900">{formatEnumValue(program.targetConcern)}</p>
                </div>
              )}
              {currentWeek && program.durationWeeks && (
                <div className="rounded-lg bg-teal-50 p-4">
                  <p className="text-xs text-teal-600 mb-1">{t("currentWeek")}</p>
                  <p className="font-semibold text-teal-900">
                    {t("weekOf", { current: currentWeek, total: program.durationWeeks })}
                  </p>
                </div>
              )}
            </div>

            {progressPct !== null && program.durationWeeks && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>{t("progress")}</span>
                  <span>{progressPct}%</span>
                </div>
                <ProgressBar value={Math.min(progressPct, 100)} />
              </div>
            )}
          </CardContent>
        </Card>

        {enrollment.notes && (
          <Card>
            <CardHeader><CardTitle>{t("notesFromPractitioner")}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed">{enrollment.notes}</p>
            </CardContent>
          </Card>
        )}

        {Array.isArray(program.phaseConfig) && program.phaseConfig.length > 0 && (
          <PhaseTimeline
            phases={program.phaseConfig as { week: number; title: string; guidance: string }[]}
            currentWeek={currentWeek}
            totalWeeks={program.durationWeeks ?? null}
          />
        )}
      </div>
    </div>
  )
}
