import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { formatDate, buildLastNDayStrings } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { DayCadenceSparkline } from "@/components/ui/day-cadence-sparkline"
import type { CadenceMap } from "@/lib/db/check-in-cadence"

type RecentClient = {
  id: string
  name: string | null
  email: string | null
  createdAt: Date
  profile: { mainConcern: string | null } | null
}

interface Props {
  clients: RecentClient[]
  cadence: CadenceMap
}

export async function RecentClientsCard({ clients, cadence }: Props) {
  const t = await getTranslations("admin.dashboard")
  const tConcerns = await getTranslations("concerns")
  const tClients = await getTranslations("admin.clients")
  const sparkDays = buildLastNDayStrings(7)
  const sparkLabels = { missed: tClients("dotMissed"), checkedIn: tClients("dotCheckedIn"), pem: tClients("dotPem") }
  const sparkHint = tClients("cadenceHint")

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("recentClients")}</CardTitle>
          <Link href="/admin/clients" className="text-sm text-teal-600 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-slate-100">
          {clients.map((client) => {
            const spark = cadence[client.id]
            return (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{client.name ?? "—"}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-400">{client.email}</p>
                    <DayCadenceSparkline
                      days={sparkDays}
                      checkedIn={new Set(spark?.checkedIn ?? [])}
                      pemDays={new Set(spark?.pemDays ?? [])}
                      hint={sparkHint}
                      dayLabels={sparkLabels}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">
                    {client.profile?.mainConcern
                      ? tConcerns(client.profile.mainConcern as Parameters<typeof tConcerns>[0])
                      : t("noProfile")}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(client.createdAt)}</p>
                </div>
              </Link>
            )
          })}
          {clients.length === 0 && (
            <div className="py-6">
              <EmptyState
                message={t("noClients")}
                action={<Link href="/admin/clients" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">{t("viewAll")} →</Link>}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
