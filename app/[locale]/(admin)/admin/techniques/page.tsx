import { db } from "@/lib/db"
import { techniques } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { TECHNIQUE_CATEGORIES } from "@/lib/constants"
import { formatEnumValue } from "@/lib/utils"
import { TechniqueActions } from "./technique-actions"
import { TechniqueCreateButton } from "./technique-create-button"

export default async function TechniquesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.techniques")

  const rows = await db.query.techniques.findMany({
    orderBy: [asc(techniques.category), asc(techniques.name)],
  })

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
      <div className="flex items-start justify-between gap-4 mb-8">
        <PageHeader title={t("title")} description={t("description", { count: activeCount })} />
        <TechniqueCreateButton />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-400 text-sm mb-4">{t("empty")}</p>
            <TechniqueCreateButton />
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
                  {items.map((technique) => (
                    <div key={technique.id} className="py-3 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium ${technique.isActive ? "text-slate-900" : "text-slate-400 line-through"}`}>
                            {technique.name}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            technique.difficulty === "easy"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : technique.difficulty === "moderate"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}>
                            {formatEnumValue(technique.difficulty)}
                          </span>
                          {technique.durationMinutes && (
                            <span className="text-xs text-slate-400">{technique.durationMinutes} min</span>
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
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
