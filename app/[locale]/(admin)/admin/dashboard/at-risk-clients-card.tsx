import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { AlertTriangle } from "lucide-react"
import { DAY_MS } from "@/lib/constants"

type AtRiskClient = {
  id: string
  name: string | null
  email: string | null
  lastCheckIn: Date | null
}

interface Props {
  clients: AtRiskClient[]
  nowMs: number
}

export async function AtRiskClientsCard({ clients, nowMs }: Props) {
  const t = await getTranslations("admin.dashboard")

  if (clients.length === 0) return null

  return (
    <Card className="mb-6 border-amber-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            {t("needsAttention")}
          </CardTitle>
          <Link href="/admin/clients/at-risk" className="text-sm text-amber-600 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-slate-100">
          {clients.map((client) => {
            const daysAgo = client.lastCheckIn
              ? Math.floor((nowMs - client.lastCheckIn.getTime()) / DAY_MS)
              : null
            return (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{client.name ?? "—"}</p>
                  <p className="text-xs text-slate-400">{client.email}</p>
                </div>
                <p className="text-xs text-amber-600 font-medium">
                  {daysAgo === null ? t("never") : t("daysAgo", { n: daysAgo })}
                </p>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
