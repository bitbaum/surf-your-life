import { db } from "@/lib/db"
import { programs, programEnrollments } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Plus, Users } from "lucide-react"

export default async function ProgramsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.programs")

  const rows = await db
    .select({
      id: programs.id,
      title: programs.title,
      description: programs.description,
      durationWeeks: programs.durationWeeks,
      targetConcern: programs.targetConcern,
      createdAt: programs.createdAt,
      enrollmentCount: count(programEnrollments.id),
    })
    .from(programs)
    .leftJoin(programEnrollments, eq(programEnrollments.programId, programs.id))
    .groupBy(programs.id)
    .orderBy(desc(programs.createdAt))

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Link
            href="/admin/programs/new"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("new")}
          </Link>
        }
      />

      <Card>
        <CardHeader><CardTitle>{t("title")} ({rows.length})</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm mb-4">{t("empty")}</p>
              <Link
                href="/admin/programs/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t("new")}
              </Link>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {rows.map((program) => (
                <Link
                  key={program.id}
                  href={`/admin/programs/${program.id}`}
                  className="py-4 flex items-start justify-between gap-4 hover:bg-slate-50 -mx-6 px-6 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{program.title}</p>
                    {program.description && (
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{program.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                      {program.durationWeeks && (
                        <span>{program.durationWeeks} {t("weeks")}</span>
                      )}
                      {program.targetConcern && (
                        <span>{formatEnumValue(program.targetConcern)}</span>
                      )}
                      <span>{formatDate(program.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 flex-shrink-0 text-sm">
                    <Users className="w-3.5 h-3.5" />
                    <span>{program.enrollmentCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
