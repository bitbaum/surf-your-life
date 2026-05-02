import { getTranslations } from "next-intl/server"
import type { CadenceMap } from "@/lib/db/check-in-cadence"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Pagination } from "@/components/ui/pagination"
import { Link } from "@/i18n/navigation"
import { buildLastNDayStrings, daysSince, displayName } from "@/lib/utils"
import { ClientTableRow, type ClientRow } from "./client-table-row"
import { MAIN_CONCERNS } from "@/lib/constants"
import type { MainConcern } from "@/lib/db/schema"

type SortOption = "joined" | "checkin_desc" | "most_checkins" | "needs_attention"
type AlertInfo = { count: number; hasHigh: boolean }

type Props = {
  clients: ClientRow[]
  alertCountMap: Map<string, AlertInfo>
  unreadMessageMap: Map<string, number>
  cadenceMap: CadenceMap
  staleCutoff: Date
  q: string | undefined
  sort: SortOption
  concern: MainConcern | undefined
  page: number
  totalPages: number
}

export async function ClientsCard({ clients, alertCountMap, unreadMessageMap, cadenceMap, staleCutoff, q, sort, concern, page, totalPages }: Props) {
  const t = await getTranslations("admin.clients")
  const tConcerns = await getTranslations("concerns")

  const sparkDays = buildLastNDayStrings(7)
  const sparkDayLabels = {
    missed: t("dotMissed"),
    checkedIn: t("dotCheckedIn"),
    pem: t("dotPem"),
  }

  function buildParams(overrides: Record<string, string | undefined>) {
    const ps = new URLSearchParams()
    if (q?.trim()) ps.set("q", q.trim())
    if (sort !== "joined") ps.set("sort", sort)
    if (concern) ps.set("concern", concern)
    for (const [k, v] of Object.entries(overrides)) {
      if (v) ps.set(k, v); else ps.delete(k)
    }
    return ps.toString()
  }

  function pageLink(p: number) {
    return `/admin/clients?${buildParams({ page: String(p) })}`
  }

  function sortLink(s: SortOption) {
    return `/admin/clients?${buildParams({ sort: s !== "joined" ? s : undefined, page: undefined })}`
  }

  function concernLink(c: MainConcern | "") {
    return `/admin/clients?${buildParams({ concern: c || undefined, page: undefined })}`
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("allClients")}</CardTitle></CardHeader>
      <CardContent>
        <FilterTabs
          tabs={[
            { value: "joined" as SortOption, label: t("sortJoined") },
            { value: "checkin_desc" as SortOption, label: t("sortCheckInDesc") },
            { value: "most_checkins" as SortOption, label: t("sortMostCheckIns") },
            { value: "needs_attention" as SortOption, label: t("sortNeedsAttention") },
          ]}
          active={sort}
          href={sortLink}
        />
        <FilterTabs
          tabs={[
            { value: "" as string, label: t("allConcerns") },
            ...MAIN_CONCERNS.map((c) => ({ value: c, label: tConcerns(c) })),
          ]}
          active={concern ?? ""}
          href={concernLink as (v: string) => string}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">{t("columnName")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnEmail")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnConcern")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnLastCheckIn")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnCheckIns")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("columnJoined")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => {
                const isStale = client.lastCheckIn == null || client.lastCheckIn < staleCutoff
                const days = daysSince(client.lastCheckIn)
                const nudgeBody = isStale
                  ? days != null
                    ? t("atRisk.nudgeBodyWithDays", { name: displayName(client.name, client.email), days })
                    : t("atRisk.nudgeBodyNever", { name: displayName(client.name, client.email) })
                  : null
                return (
                  <ClientTableRow
                    key={client.id}
                    client={client}
                    alert={alertCountMap.get(client.id)}
                    unreadMessages={unreadMessageMap.get(client.id) ?? 0}
                    isStale={isStale}
                    staleHint={t("staleHint")}
                    viewLabel={t("viewLink")}
                    sparkDays={sparkDays}
                    sparkCheckedIn={new Set(cadenceMap[client.id]?.checkedIn ?? [])}
                    sparkPemDays={new Set(cadenceMap[client.id]?.pemDays ?? [])}
                    sparkHint={t("cadenceHint")}
                    sparkDayLabels={sparkDayLabels}
                    nudge={isStale && nudgeBody
                      ? {
                          label: t("atRisk.nudgeButton"),
                          modalTitle: t("atRisk.nudgeModalTitle"),
                          subject: t("atRisk.nudgeSubject"),
                          body: nudgeBody,
                        }
                      : null}
                  />
                )
              })}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <p>
                      {q
                        ? t("noResults")
                        : sort === "needs_attention"
                          ? t("noNeedsAttention")
                          : t("noClients")}
                    </p>
                    {q && (
                      <Link
                        href="/admin/clients"
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors mt-2 inline-block"
                      >
                        {t("clearSearch")}
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
      </CardContent>
    </Card>
  )
}
