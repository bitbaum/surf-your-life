import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { CheckInRow } from "./check-in-row"
import { getTranslations } from "next-intl/server"
import type { checkIns } from "@/lib/db/schema"
import type { InferSelectModel } from "drizzle-orm"

type CheckIn = InferSelectModel<typeof checkIns>

interface ClientCheckInsCardProps {
  clientId: string
  checkIns: CheckIn[]
  totalCheckIns: number
}

export async function ClientCheckInsCard({ clientId, checkIns, totalCheckIns }: ClientCheckInsCardProps) {
  const t = await getTranslations("admin.clients")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>
            {t("detail.checkInsCard")} ({totalCheckIns})
            {totalCheckIns > PAGINATION_DEFAULT && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {t("detail.showingRecent", { n: PAGINATION_DEFAULT })}
              </span>
            )}
          </span>
          {totalCheckIns > PAGINATION_DEFAULT && (
            <Link
              href={`/admin/clients/${clientId}/check-ins`}
              className="text-xs font-normal text-teal-600 hover:underline"
            >
              {t("detail.viewAllCheckIns")}
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {checkIns.length > 0 ? (
          <div className="flex flex-col divide-y divide-slate-100">
            {checkIns.map((ci) => (
              <CheckInRow key={ci.id} ci={ci} />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm">{t("detail.noCheckIns")}</p>
        )}
      </CardContent>
    </Card>
  )
}
