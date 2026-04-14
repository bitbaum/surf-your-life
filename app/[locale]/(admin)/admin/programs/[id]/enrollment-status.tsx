"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { programStatusEnum } from "@/lib/db/schema"

interface EnrollmentStatusProps {
  enrollmentId: string
  currentStatus: (typeof programStatusEnum.enumValues)[number]
}

const STATUS_STYLES = {
  active: "bg-teal-50 text-teal-700 border border-teal-200",
  paused: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  completed: "bg-slate-100 text-slate-600 border border-slate-200",
}

export function EnrollmentStatus({ enrollmentId, currentStatus }: EnrollmentStatusProps) {
  const t = useTranslations("admin.programs")
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)

  async function updateStatus(next: typeof currentStatus) {
    setSaving(true)
    const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    setSaving(false)
    if (res.ok) {
      setStatus(next)
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
        {t(`status.${status}`)}
      </span>
      {status !== "completed" && (
        <select
          value=""
          disabled={saving}
          onChange={(e) => {
            if (e.target.value) updateStatus(e.target.value as typeof currentStatus)
          }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500 min-h-[32px]"
        >
          <option value="">{t("changeStatus")}</option>
          {programStatusEnum.enumValues
            .filter((s) => s !== status)
            .map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
        </select>
      )}
    </div>
  )
}
