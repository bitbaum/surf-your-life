"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ResolveAlertButton } from "./resolve-button"
import { formatDate } from "@/lib/utils"
import { ALERT_SEVERITY_DOT, ALERT_SEVERITY_BADGE, ALERT_SEVERITY_ORDER } from "@/lib/constants"
import type { AlertType, AlertSeverity } from "@/lib/db/schema"
import { EmptyState } from "@/components/ui/empty-state"
import { Card } from "@/components/ui/card"
import { DayCadenceSparkline, type DayState } from "@/components/ui/day-cadence-sparkline"
import { CheckCircle } from "lucide-react"

const ALL_FILTER = "all" as const
type TypeFilter = AlertType | typeof ALL_FILTER

export type AlertRow = {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  createdAt: Date
  client: { id: string; name: string | null; email: string }
}

interface Props {
  initialAlerts: AlertRow[]
  sparkDays: string[]
  sparkData: Record<string, { checkedIn: string[]; pemDays: string[] }>
  sparkLabels: Record<DayState, string>
  sparkHint: string
}

export function AlertList({ initialAlerts, sparkDays, sparkData, sparkLabels, sparkHint }: Props) {
  const t = useTranslations("admin.alerts")
  const [alerts, setAlerts] = useState(initialAlerts)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL_FILTER)
  const [resolvingAll, setResolvingAll] = useState(false)

  function handleResolved(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  async function handleResolveAll() {
    const ids = visible.map((a) => a.id)
    if (ids.length === 0) return
    setResolvingAll(true)
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) setAlerts((prev) => prev.filter((a) => !ids.includes(a.id)))
    } finally {
      setResolvingAll(false)
    }
  }

  const activeTypes = [...new Set(alerts.map((a) => a.type))] as AlertType[]
  const visible = typeFilter === ALL_FILTER ? alerts : alerts.filter((a) => a.type === typeFilter)

  if (alerts.length === 0) {
    return (
      <Card className="py-16">
        <EmptyState
          icon={<div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center"><span className="text-teal-600 text-lg">✓</span></div>}
          message={t("allClear")}
          description={t("allClearSubtext")}
        />
      </Card>
    )
  }

  const grouped = Object.fromEntries(ALERT_SEVERITY_ORDER.map((s) => [s, [] as AlertRow[]])) as Record<AlertSeverity, AlertRow[]>
  for (const alert of visible) grouped[alert.severity].push(alert)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {activeTypes.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter(ALL_FILTER)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === ALL_FILTER ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
            >
              {t("filterAll")} ({alerts.length})
            </button>
            {activeTypes.map((type) => {
              const count = alerts.filter((a) => a.type === type).length
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === type ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                >
                  {t(`type.${type}`)} ({count})
                </button>
              )
            })}
          </div>
        ) : (
          <div />
        )}
        {visible.length > 1 && (
          <button
            onClick={handleResolveAll}
            disabled={resolvingAll}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {resolvingAll ? t("resolvingAll") : t("resolveAll", { n: visible.length })}
          </button>
        )}
      </div>
      {ALERT_SEVERITY_ORDER.map((sev) => {
        const group = grouped[sev]
        if (group.length === 0) return null
        return (
          <section key={sev}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${ALERT_SEVERITY_DOT[sev]}`} />
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {t(`severity.${sev}`)} · {group.length}
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {group.map((alert) => {
                const spark = sparkData[alert.client.id]
                const checkedInSet = new Set(spark?.checkedIn ?? [])
                const pemSet = new Set(spark?.pemDays ?? [])
                return (
                  <div
                    key={alert.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4"
                  >
                    {/* Severity badge */}
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${ALERT_SEVERITY_BADGE[alert.severity]}`}>
                      {t(`severity.${alert.severity}`)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-0.5">
                        <Link
                          href={`/admin/clients/${alert.client.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-teal-600 transition-colors"
                        >
                          {alert.client.name ?? alert.client.email}
                        </Link>
                        <span className="text-xs text-slate-400">{alert.client.email}</span>
                        <DayCadenceSparkline
                          days={sparkDays}
                          checkedIn={checkedInSet}
                          pemDays={pemSet}
                          hint={sparkHint}
                          dayLabels={sparkLabels}
                        />
                      </div>
                      <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-1.5">{formatDate(alert.createdAt)}</p>
                    </div>

                    {/* Resolve */}
                    <div className="flex-shrink-0 pt-0.5">
                      <ResolveAlertButton alertId={alert.id} onResolved={handleResolved} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
