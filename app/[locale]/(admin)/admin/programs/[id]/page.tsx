import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { programs, programEnrollments, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { ADMIN_ENROLLMENTS_MAX } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { EnrollmentStatus } from "./enrollment-status"
import { EditProgramForm } from "./edit-program-form"
import { Users } from "lucide-react"

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.programs")

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
            <p className="text-slate-400 text-sm py-6 text-center">{t("noEnrollments")}</p>
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
