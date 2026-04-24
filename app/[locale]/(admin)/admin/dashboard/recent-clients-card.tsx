import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"

type RecentClient = {
  id: string
  name: string | null
  email: string | null
  createdAt: Date
  profile: { mainConcern: string | null } | null
}

interface Props {
  clients: RecentClient[]
}

export async function RecentClientsCard({ clients }: Props) {
  const t = await getTranslations("admin.dashboard")

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
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{client.name ?? "—"}</p>
                <p className="text-xs text-slate-400">{client.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">
                  {client.profile?.mainConcern
                    ? formatEnumValue(client.profile.mainConcern)
                    : t("noProfile")}
                </p>
                <p className="text-xs text-slate-400">{formatDate(client.createdAt)}</p>
              </div>
            </Link>
          ))}
          {clients.length === 0 && (
            <div className="py-6">
              <EmptyState message={t("noClients")} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
