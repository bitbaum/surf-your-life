import { useTranslations } from "next-intl"
import type { Booking, Service } from "@/lib/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type BookingWithService = Booking & { service: Service }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  confirmed: "bg-teal-50 text-teal-700",
  cancelled: "bg-red-50 text-red-600",
}

function BookingListContent({ bookings }: { bookings: BookingWithService[] }) {
  const t = useTranslations("portal.book")

  if (bookings.length === 0) {
    return <p className="text-sm text-slate-400 py-4">{t("noBookings")}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((b) => (
        <div key={b.id} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
          <div>
            <p className="text-sm font-medium text-slate-900">{b.service.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {b.preferredDate}
              {b.preferredTime ? ` · ${b.preferredTime}` : ""}
            </p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status] ?? STATUS_COLORS.pending}`}>
            {t(`status${b.status.charAt(0).toUpperCase() + b.status.slice(1)}` as Parameters<typeof t>[0])}
          </span>
        </div>
      ))}
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
        <BookingListContent bookings={bookings} />
      </CardContent>
    </Card>
  )
}
