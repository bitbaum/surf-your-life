import { getTranslations } from "next-intl/server"
import type { CadenceMap } from "@/lib/db/check-in-cadence"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { Link } from "@/i18n/navigation"
import { buildLastNDayStrings, daysSince, displayName } from "@/lib/utils"
import { ClientTableRow, type ClientRow } from "./client-table-row"
import type { MainConcern } from "@/lib/db/schema"
import { ClientsFilterBar } from "./clients-filter-bar"

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
  practitioner: string | undefined
  page: number
  totalPages: number
}

export async function ClientsCard({ clients, alertCountMap, unreadMessageMap, cadenceMap, staleCutoff, q, sort, concern, practitioner, page, totalPages }: Props) {
  const t = await getTranslations("admin.clients")

  const sparkDays = buildLastNDayStrings(7)
  const sparkDayLabels = {
    missed: t("dotMissed"),
    checkedIn: t("dotCheckedIn"),
    pem: t("dotPem"),
  }

  function pageLink(p: number) {
    const ps = new URLSearchParams()
    ps.set("page", String(p))
    if (q?.trim()) ps.set("q", q.trim())
    if (sort !== "joined") ps.set("sort", sort)
    if (concern) ps.set("concern", concern)
    if (practitioner) ps.set("practitioner", practitioner)
    return `/admin/clients?${ps.toString()}`
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("allClients")}</CardTitle></CardHeader>
      <CardContent>
        <ClientsFilterBar q={q} sort={sort} concern={concern} practitioner={practitioner} />
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
