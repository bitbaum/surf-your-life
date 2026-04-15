"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ResolveAlertButton } from "./resolve-button"
import { formatDate } from "@/lib/utils"
import type { AlertType, AlertSeverity } from "@/lib/db/schema"

export type AlertRow = {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  createdAt: Date
  client: { id: string; name: string | null; email: string }
}

const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  high:   "bg-red-50 text-red-700 border-red-200",
  medium: "bg-orange-50 text-orange-700 border-orange-200",
  low:    "bg-yellow-50 text-yellow-700 border-yellow-200",
}

const SEVERITY_DOT: Record<AlertSeverity, string> = {
  high:   "bg-red-500",
  medium: "bg-orange-400",
  low:    "bg-yellow-400",
}

interface Props {
  initialAlerts: AlertRow[]
}

export function AlertList({ initialAlerts }: Props) {
  const t = useTranslations("admin.alerts")
  const [alerts, setAlerts] = useState(initialAlerts)

  function handleResolved(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16 flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
          <span className="text-teal-600 text-lg">✓</span>
        </div>
        <p className="font-medium text-slate-700">{t("allClear")}</p>
        <p className="text-sm text-slate-400">{t("allClearSubtext")}</p>
      </div>
    )
  }

  // Group by severity: high → medium → low
  const grouped: Record<AlertSeverity, AlertRow[]> = { high: [], medium: [], low: [] }
  for (const alert of alerts) grouped[alert.severity].push(alert)

  return (
    <div className="flex flex-col gap-6">
      {(["high", "medium", "low"] as AlertSeverity[]).map((sev) => {
        const group = grouped[sev]
        if (group.length === 0) return null
        return (
          <section key={sev}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[sev]}`} />
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {t(`severity.${sev}`)} · {group.length}
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {group.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4"
                >
                  {/* Severity badge */}
                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${SEVERITY_STYLE[alert.severity]}`}>
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
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
