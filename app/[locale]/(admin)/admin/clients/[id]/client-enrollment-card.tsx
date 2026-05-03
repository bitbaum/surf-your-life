import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { EnrollmentStatus } from "../../programs/[id]/enrollment-status"
import { computeProgramProgress } from "@/lib/domain/check-in"
import type { programEnrollments, programs } from "@/lib/db/schema"

type Enrollment = typeof programEnrollments.$inferSelect & {
  program: Pick<typeof programs.$inferSelect, "title" | "durationWeeks" | "phaseConfig">
}

interface Props {
  enrollment: Enrollment
}

export async function ClientEnrollmentCard({ enrollment }: Props) {
  const t = await getTranslations("admin.clients")

  const progress = enrollment.status === "active"
    ? computeProgramProgress(enrollment)
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("detail.programCard")}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href={`/admin/programs/${enrollment.programId}`}
              className="font-medium text-slate-900 hover:text-teal-600 transition-colors"
            >
              {enrollment.program.title}
            </Link>
            <div className="flex flex-wrap gap-3 mt-1 text-slate-500">
              {enrollment.startDate && (
                <span>{t("detail.startedOn", { date: formatDate(enrollment.startDate) })}</span>
              )}
              {progress && enrollment.program.durationWeeks && (
                <span className="font-medium text-teal-700">
                  {t("detail.weekOf", { current: progress.currentWeek, total: enrollment.program.durationWeeks })}
                </span>
              )}
              {!progress && enrollment.program.durationWeeks && (
                <span>{enrollment.program.durationWeeks} {t("detail.weeks")}</span>
              )}
            </div>
            {progress?.currentPhase && (
              <div className="mt-2 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2">
                <p className="text-xs text-teal-500 mb-0.5">{t("detail.currentPhaseLabel")}</p>
                <p className="font-medium text-teal-900">{progress.currentPhase.title}</p>
                {progress.currentPhase.guidance && (
                  <p className="text-xs text-teal-700 mt-0.5 leading-relaxed line-clamp-2">
                    {progress.currentPhase.guidance}
                  </p>
                )}
              </div>
            )}
            {enrollment.notes && (
              <p className="text-slate-500 mt-2 italic">{enrollment.notes}</p>
            )}
          </div>
          <EnrollmentStatus
            enrollmentId={enrollment.id}
            currentStatus={enrollment.status}
          />
        </div>
      </CardContent>
    </Card>
  )
}
