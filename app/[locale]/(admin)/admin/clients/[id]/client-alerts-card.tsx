"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResolveAlertButton } from "../../alerts/resolve-button"
import { formatDate } from "@/lib/utils"
import { ALERT_SEVERITY_BADGE } from "@/lib/constants"
import type { AlertSeverity } from "@/lib/db/schema"

export type ClientAlertRow = {
  id: string
  type: string
  severity: AlertSeverity
  title: string
  message: string
  createdAt: Date
}

interface Props {
  initialAlerts: ClientAlertRow[]
}

export function ClientAlertsCard({ initialAlerts }: Props) {
  const t = useTranslations("admin.alerts")
  const [alerts, setAlerts] = useState(initialAlerts)

  if (alerts.length === 0) return null

  function handleResolved(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {t("title")} ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${ALERT_SEVERITY_BADGE[alert.severity]}`}>
                {t(`severity.${alert.severity}`)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(alert.createdAt)}</p>
              </div>
              <div className="flex-shrink-0 pt-0.5">
                <ResolveAlertButton alertId={alert.id} onResolved={handleResolved} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
