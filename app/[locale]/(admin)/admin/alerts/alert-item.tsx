"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { ResolveAlertButton } from "./resolve-button"
import { formatDate } from "@/lib/utils"
import { ALERT_SEVERITY_BADGE } from "@/lib/constants"
import { DayCadenceSparkline, type DayState } from "@/components/ui/day-cadence-sparkline"
import type { AlertRow } from "./alert-list"

interface Props {
  alert: AlertRow
  sparkDays: string[]
  sparkCheckedIn: Set<string>
  sparkPemDays: Set<string>
  sparkLabels: Record<DayState, string>
  sparkHint: string
  onResolved: (id: string) => void
}

export function AlertItem({ alert, sparkDays, sparkCheckedIn, sparkPemDays, sparkLabels, sparkHint, onResolved }: Props) {
  const t = useTranslations("admin.alerts")

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-4">
      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${ALERT_SEVERITY_BADGE[alert.severity]}`}>
        {t(`severity.${alert.severity}`)}
      </span>

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
            checkedIn={sparkCheckedIn}
            pemDays={sparkPemDays}
            hint={sparkHint}
            dayLabels={sparkLabels}
          />
        </div>
        <p className="text-sm font-medium text-slate-800">{alert.title}</p>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
        <p className="text-xs text-slate-400 mt-1.5">{formatDate(alert.createdAt)}</p>
      </div>

      <div className="flex-shrink-0 pt-0.5">
        <ResolveAlertButton alertId={alert.id} onResolved={onResolved} />
      </div>
    </div>
  )
}
