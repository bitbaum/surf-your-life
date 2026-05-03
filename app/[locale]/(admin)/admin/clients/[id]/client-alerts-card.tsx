"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertRow } from "./client-alert-row"
import type { AlertSeverity } from "@/lib/db/schema"

export type ClientAlertRow = {
  id: string
  clientId: string
  type: string
  severity: AlertSeverity
  title: string
  message: string
  createdAt: Date
  resolvedAt: Date | string | null
  isResolved: boolean
}

interface Props {
  initialAlerts: ClientAlertRow[]
  clientId: string
  hasHistory: boolean
}

export function ClientAlertsCard({ initialAlerts, clientId, hasHistory }: Props) {
  const t = useTranslations("admin.alerts")
  const [alerts, setAlerts] = useState(initialAlerts)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ClientAlertRow[] | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [resolvingAll, setResolvingAll] = useState(false)

  // Only hide if there are no active alerts AND no history to show
  if (alerts.length === 0 && !showHistory && !hasHistory) return null

  function handleResolved(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleResolveAll() {
    setResolvingAll(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/alerts`, { method: "PATCH" })
      if (res.ok) setAlerts([])
    } finally {
      setResolvingAll(false)
    }
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
          <div className="flex items-center gap-3">
            {alerts.length > 1 && (
              <button
                onClick={handleResolveAll}
                disabled={resolvingAll}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {resolvingAll ? t("resolvingAll") : t("resolveAll", { n: alerts.length })}
              </button>
            )}
            <button
              onClick={toggleHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              <History className="w-3.5 h-3.5" />
              {showHistory ? t("hideHistory") : t("showHistory")}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {alerts.length === 0 && (
            <p className="text-xs text-slate-400 py-1">{t("noActiveAlerts")}</p>
          )}
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
