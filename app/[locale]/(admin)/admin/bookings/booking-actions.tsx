"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

type Props = {
  bookingId: string
  currentStatus: string
}

export function BookingActions({ bookingId, currentStatus }: Props) {
  const t = useTranslations("admin.bookings")
  const router = useRouter()
  const [loading, setLoading] = useState<"confirmed" | "cancelled" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function updateStatus(status: "confirmed" | "cancelled") {
    setLoading(status)
    setError(null)

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const json = await res.json()
      if (!json.success) {
        setError(json.error ?? t("error"))
        return
      }

      router.refresh()
    } catch {
      setError(t("error"))
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus === "cancelled") return null

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "pending" && (
        <button
          onClick={() => updateStatus("confirmed")}
          disabled={loading !== null}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading === "confirmed" ? t("confirming") : t("confirm")}
        </button>
      )}
      <button
        onClick={() => updateStatus("cancelled")}
        disabled={loading !== null}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading === "cancelled" ? t("cancelling") : t("cancel")}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
