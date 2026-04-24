"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResolveAlertButton } from "../../alerts/resolve-button"
import { formatDate } from "@/lib/utils"
import { ALERT_SEVERITY_BADGE } from "@/lib/constants"
import type { AlertSeverity } from "@/lib/db/schema"

export type ClientAlertRow = {
  id: string
  clientId: string
  type: string
  severity: AlertSeverity
  title: string
  message: string
  createdAt: Date
  isResolved: boolean
}

interface Props {
  initialAlerts: ClientAlertRow[]
  clientId: string
}

function AlertRow({ alert, onResolved, showResolveButton }: {
  alert: ClientAlertRow
  onResolved?: (id: string) => void
  showResolveButton: boolean
}) {
  const t = useTranslations("admin.alerts")
  return (
    <div className={`flex items-start gap-3 py-2 border-b border-slate-100 last:border-0 ${alert.isResolved ? "opacity-60" : ""}`}>
      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${ALERT_SEVERITY_BADGE[alert.severity]}`}>
        {t(`severity.${alert.severity}`)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{alert.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
        <p className="text-xs text-slate-400 mt-1">{formatDate(alert.createdAt)}</p>
      </div>
      <div className="flex-shrink-0 pt-0.5">
        {showResolveButton && onResolved ? (
          <ResolveAlertButton alertId={alert.id} onResolved={onResolved} />
        ) : (
          <span className="text-xs text-slate-400 font-medium">{t("resolvedLabel")}</span>
        )}
      </div>
    </div>
  )
}

export function ClientAlertsCard({ initialAlerts, clientId }: Props) {
  const t = useTranslations("admin.alerts")
  const [alerts, setAlerts] = useState(initialAlerts)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ClientAlertRow[] | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  if (alerts.length === 0 && !showHistory) return null

  function handleResolved(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  async function toggleHistory() {
    if (showHistory) {
      setShowHistory(false)
      return
    }
    if (history !== null) {
      setShowHistory(true)
      return
    }
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/alerts`)
      if (res.ok) {
        const json = await res.json()
        setHistory(json.data as ClientAlertRow[])
      }
    } finally {
      setLoadingHistory(false)
      setShowHistory(true)
    }
  }

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            {t("title")} ({alerts.length})
          </CardTitle>
          <button
            onClick={toggleHistory}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <History className="w-3.5 h-3.5" />
            {showHistory ? t("hideHistory") : t("showHistory")}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onResolved={handleResolved}
              showResolveButton={true}
            />
          ))}

          {showHistory && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              {history && history.length > 0 ? (
                history.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    showResolveButton={false}
                  />
                ))
              ) : (
                <p className="text-xs text-slate-400 py-2">{t("noHistory")}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
