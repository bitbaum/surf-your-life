import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { EnrollmentStatus } from "../../programs/[id]/enrollment-status"
import type { programEnrollments, programs } from "@/lib/db/schema"

type Enrollment = typeof programEnrollments.$inferSelect & {
  program: Pick<typeof programs.$inferSelect, "title" | "durationWeeks">
}

interface Props {
  enrollment: Enrollment
}

export async function ClientEnrollmentCard({ enrollment }: Props) {
  const t = await getTranslations("admin.clients")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("detail.programCard")}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
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
              {enrollment.program.durationWeeks && (
                <span>{enrollment.program.durationWeeks} {t("detail.weeks")}</span>
              )}
            </div>
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
