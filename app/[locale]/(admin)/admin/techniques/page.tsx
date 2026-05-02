import { db } from "@/lib/db"
import { techniques, techniqueAssignments } from "@/lib/db/schema"
import { asc, count, eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { TECHNIQUE_CATEGORIES, DIFFICULTY_BADGE_CLASSES, TECHNIQUES_MAX } from "@/lib/constants"
import { TechniqueActions } from "./technique-actions"
import { TechniqueCreateButton } from "./technique-create-button"
import { EmptyState } from "@/components/ui/empty-state"
import { Users } from "lucide-react"

export default async function TechniquesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.techniques")

  const [rows, assignmentCounts] = await Promise.all([
    db.query.techniques.findMany({
      orderBy: [asc(techniques.category), asc(techniques.name)],
      limit: TECHNIQUES_MAX,
    }),
    db
      .select({ techniqueId: techniqueAssignments.techniqueId, count: count() })
      .from(techniqueAssignments)
      .where(eq(techniqueAssignments.isActive, true))
      .groupBy(techniqueAssignments.techniqueId),
  ])
  const assignmentCountMap = new Map(assignmentCounts.map((r) => [r.techniqueId, r.count]))

  // Group by category for display
  const grouped = TECHNIQUE_CATEGORIES.map(({ value, emoji }) => ({
    category: value,
    emoji,
    label: t(`category.${value}`),
    items: rows.filter((r) => r.category === value),
  })).filter((g) => g.items.length > 0)

  const inactiveRows = rows.filter((r) => !r.isActive)
  const activeCount = rows.length - inactiveRows.length

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("description", { count: activeCount })}
        action={<TechniqueCreateButton />}
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              message={t("empty")}
              action={<TechniqueCreateButton />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ category, emoji, label, items }) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{emoji}</span>
                  {label}
                  <span className="text-sm font-normal text-slate-400">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col divide-y divide-slate-100">
                  {items.map((technique) => {
                    const clientCount = assignmentCountMap.get(technique.id) ?? 0
                    return (
                      <div key={technique.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${technique.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>
                              {technique.name}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFFICULTY_BADGE_CLASSES[technique.difficulty] ?? DIFFICULTY_BADGE_CLASSES.easy}`}>
                              {t(`difficulty.${technique.difficulty}` as Parameters<typeof t>[0])}
                            </span>
                            {technique.durationMinutes && (
                              <span className="text-xs text-slate-400">{technique.durationMinutes} min</span>
                            )}
                            {clientCount > 0 && (
                              <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                                <Users className="w-3 h-3" />
                                {t("clientCount", { count: clientCount })}
                              </span>
                            )}
                            {!technique.isActive && (
                              <span className="text-xs text-slate-400">{t("archived")}</span>
                            )}
                          </div>
                          {technique.description && (
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{technique.description}</p>
                          )}
                        </div>
                        <TechniqueActions technique={technique} />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
