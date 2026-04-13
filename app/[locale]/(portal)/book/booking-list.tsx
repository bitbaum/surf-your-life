"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { Booking, Service } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BookingWithService = Booking & { service: Service }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  confirmed: "bg-teal-50 text-teal-700",
  cancelled: "bg-red-50 text-red-600",
}

function CancelButton({ bookingId }: { bookingId: string }) {
  const t = useTranslations("portal.book")
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed")
      router.refresh()
    } catch {
      setError(t("cancelError"))
      setCancelling(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="text-xs text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {cancelling ? t("cancelling") : t("cancelBooking")}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function BookingList({ bookings }: { bookings: BookingWithService[] }) {
  const t = useTranslations("portal.book")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("yourBookings")}</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">{t("noBookings")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{b.service.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {b.preferredDate}
                    {b.preferredTime ? ` · ${b.preferredTime}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status] ?? STATUS_COLORS.pending}`}
                  >
                    {t(`status${b.status.charAt(0).toUpperCase() + b.status.slice(1)}` as Parameters<typeof t>[0])}
                  </span>
                  {b.status !== "cancelled" && <CancelButton bookingId={b.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
