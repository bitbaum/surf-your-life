"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Status = "new" | "contacted" | "dismissed"

interface Props {
  leadId: string
  currentStatus: Status
}

const STATUS_CONFIG: { value: Status; label: string; badge: string; active: string }[] = [
  {
    value: "new",
    label: "New",
    badge: "bg-slate-100 text-slate-600",
    active: "bg-slate-200 text-slate-800 font-semibold",
  },
  {
    value: "contacted",
    label: "Contacted",
    badge: "bg-teal-50 text-teal-700",
    active: "bg-teal-100 text-teal-800 font-semibold",
  },
  {
    value: "dismissed",
    label: "Dismissed",
    badge: "bg-red-50 text-red-600",
    active: "bg-red-100 text-red-700 font-semibold",
  },
]

export function LeadStatus({ leadId, currentStatus }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleChange(next: Status) {
    if (next === status || loading) return
    setLoading(true)
    const res = await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setStatus(next)
      router.refresh()
    }
    setLoading(false)
  }

  const current = STATUS_CONFIG.find((s) => s.value === status)!

  return (
    <div className="flex items-center gap-1.5">
      {STATUS_CONFIG.map((s) => (
        <button
          key={s.value}
          onClick={() => handleChange(s.value)}
          disabled={loading}
          className={`px-2 py-0.5 rounded-full text-xs transition-all disabled:opacity-50 ${
            status === s.value ? s.active : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          }`}
          title={`Mark as ${s.label}`}
        >
          {s.label}
        </button>
      ))}
      <span
        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${current.badge}`}
        aria-label="current status"
      >
        {current.label}
      </span>
    </div>
  )
}
