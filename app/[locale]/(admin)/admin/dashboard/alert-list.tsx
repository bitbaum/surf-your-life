"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"

type Alert = {
  id: string
  clientId: string
  title: string
  message: string
  severity: string
  client: { id: string; name: string | null; email: string }
}

export function AlertList({ alerts }: { alerts: Alert[] }) {
  const t = useTranslations("admin.dashboard")
  const router = useRouter()
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  async function dismiss(alertId: string) {
    setDismissing((s) => new Set(s).add(alertId))

    const res = await fetch(`/api/admin/alerts/${alertId}`, { method: "PATCH" })
    if (res.ok) {
      setDismissed((s) => new Set(s).add(alertId))
      router.refresh()
    }
    setDismissing((s) => { const n = new Set(s); n.delete(alertId); return n })
  }

  const visible = alerts.filter((a) => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      {visible.map((alert) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white transition-colors"
        >
          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
            alert.severity === "high" ? "bg-red-500" :
            alert.severity === "medium" ? "bg-amber-500" : "bg-slate-400"
          }`} />

          <Link
            href={`/admin/clients/${alert.clientId}`}
            className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-slate-800">{alert.title}</p>
              <span className="text-xs text-slate-400">· {alert.client.name ?? alert.client.email}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{alert.message}</p>
          </Link>

          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
            alert.severity === "high" ? "bg-red-50 text-red-700 border border-red-200" :
            alert.severity === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-slate-100 text-slate-600 border border-slate-200"
          }`}>
            {alert.severity}
          </span>

          <button
            onClick={() => dismiss(alert.id)}
            disabled={dismissing.has(alert.id)}
            title={t("dismissAlert")}
            className="flex-shrink-0 p-1 rounded-md text-slate-300 hover:text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
