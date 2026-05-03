import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { programs, programEnrollments, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { ADMIN_ENROLLMENTS_MAX, SEVEN_DAYS_MS } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { EnrollmentStatus } from "./enrollment-status"
import { EditProgramForm } from "./edit-program-form"
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"
import type { ProgramPhase } from "@/lib/domain/program"

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.programs")

  const nowMs = Date.now() // eslint-disable-line react-hooks/purity -- server component

  const program = await db.query.programs.findFirst({
    where: eq(programs.id, id),
  })
  if (!program) notFound()

  const enrollments = await db
    .select({
      id: programEnrollments.id,
      status: programEnrollments.status,
      startDate: programEnrollments.startDate,
      notes: programEnrollments.notes,
      createdAt: programEnrollments.createdAt,
      clientId: users.id,
      clientName: users.name,
      clientEmail: users.email,
    })
    .from(programEnrollments)
    .innerJoin(users, eq(users.id, programEnrollments.clientId))
    .where(eq(programEnrollments.programId, id))
    .orderBy(desc(programEnrollments.createdAt))
    .limit(ADMIN_ENROLLMENTS_MAX)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/programs" className="text-sm text-slate-400 hover:text-slate-600">
          ← {t("backToPrograms")}
        </Link>
      </div>

      <div className="mb-6">
        <EditProgramForm program={program} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("enrolledClients")} ({enrollments.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <EmptyState
              message={t("noEnrollments")}
              action={<Link href="/admin/clients" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">{t("viewClients")} →</Link>}
              className="py-6"
            />
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {enrollments.map((e) => (
                <div key={e.id} className="py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/clients/${e.clientId}`}
                      className="font-medium text-slate-900 hover:text-teal-600 transition-colors"
                    >
                      {e.clientName ?? t("unnamed")}
                    </Link>
                    <p className="text-sm text-slate-500">{e.clientEmail}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-slate-400">
                      {e.startDate && (
                        <span>{t("startedOn", { date: formatDate(e.startDate) })}</span>
                      )}
                      <span>{t("enrolledOn", { date: formatDate(e.createdAt) })}</span>
                      {(() => {
                        if (!e.startDate || !program.durationWeeks || e.status !== "active") return null
                        const week = Math.floor((nowMs - e.startDate.getTime()) / SEVEN_DAYS_MS) + 1
                        if (week < 1 || week > program.durationWeeks) return null
                        const phases = program.phaseConfig as ProgramPhase[] | null
                        const phase = phases?.filter((p) => p.week <= week)?.sort((a, b) => b.week - a.week)[0] ?? null
                        return (
                          <span className="font-medium text-teal-600">
                            {t("weekProgress", { current: week, total: program.durationWeeks })}
                            {phase?.title && ` · ${phase.title}`}
                          </span>
                        )
                      })()}
                    </div>
                    {e.notes && (
                      <p className="text-xs text-slate-500 mt-1.5 italic">{e.notes}</p>
                    )}
                  </div>
                  <EnrollmentStatus enrollmentId={e.id} currentStatus={e.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
