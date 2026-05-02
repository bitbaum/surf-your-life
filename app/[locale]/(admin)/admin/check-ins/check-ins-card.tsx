import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { Pagination } from "@/components/ui/pagination"
import { SearchInput } from "@/components/ui/search-input"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { formatDate } from "@/lib/utils"
import { MOOD_EMOJI, MOODS } from "@/lib/constants"
import { Suspense } from "react"

export type FilterMode = "all" | "pem" | "today"

type CheckInRow = {
  id: string
  createdAt: Date
  mood: string
  energyLevel: number
  sleepHours: number | null
  pemFlag: boolean | null
  pemSeverity: number | null
  clientId: string
  clientName: string | null
  clientEmail: string | null
}

type Props = {
  rows: CheckInRow[]
  filter: FilterMode
  todayCount: number
  q: string | undefined
  page: number
  totalPages: number
  filterHref: (v: FilterMode) => string
  pageHref: (p: number) => string
}

export async function CheckInsCard({ rows, filter, todayCount, q, page, totalPages, filterHref, pageHref }: Props) {
  const t = await getTranslations("admin.checkIns")
  const tCheckIn = await getTranslations("portal.checkIn")
  const moodMap = Object.fromEntries(MOODS.map((m) => [m.value, m]))

  return (
    <Card>
      <CardHeader><CardTitle>{t("title")}</CardTitle></CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <Suspense>
              <SearchInput placeholder={t("searchPlaceholder")} defaultValue={q ?? ""} />
            </Suspense>
          </div>
          <FilterTabs
            tabs={[
              { value: "all" as FilterMode, label: t("filterAll") },
              { value: "today" as FilterMode, label: t("filterToday", { count: todayCount }) },
              { value: "pem" as FilterMode, label: t("filterPem") },
            ]}
            active={filter}
            href={filterHref}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">{t("client")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("date")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("mood")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("energy")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("sleep")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((ci) => (
                <tr key={ci.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-medium text-slate-800">
                    <Link href={`/admin/clients/${ci.clientId}`} className="hover:text-teal-700 transition-colors">
                      {ci.clientName ?? ci.clientEmail}
                    </Link>
                  </td>
                  <td className="py-3 text-slate-500">{formatDate(ci.createdAt)}</td>
                  <td className="py-3">
                    <span className="flex items-center gap-1.5">
                      <span>{MOOD_EMOJI[ci.mood] ?? "😐"}</span>
                      <span className="text-slate-600">{tCheckIn(moodMap[ci.mood]?.labelKey ?? "moodNeutral")}</span>
                      {ci.pemFlag && (
                        <span className="text-xs font-semibold text-red-600 ml-1">
                          PEM{ci.pemSeverity ? ` ${ci.pemSeverity}/10` : ""}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">
                    <strong>{ci.energyLevel}</strong>
                    <span className="text-slate-400">/10</span>
                  </td>
                  <td className="py-3 text-slate-500">
                    {ci.sleepHours != null ? (
                      <span><strong className="text-slate-700">{ci.sleepHours}</strong>h</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/clients/${ci.clientId}`}
                      className="text-teal-600 hover:underline text-xs font-medium"
                    >
                      {t("viewClient")}
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {filter === "today" ? t("noActivityToday") : q ? t("noResults", { q }) : t("noActivity")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} pageLink={pageHref} />
      </CardContent>
    </Card>
  )
}
