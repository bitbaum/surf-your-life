import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate } from "@/lib/utils"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { BookingActions } from "./booking-actions"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { FilterTabs } from "@/components/ui/filter-tabs"

type BookingStatus = "pending" | "confirmed" | "cancelled"

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.bookings")

  const STATUS_FILTERS: { value: BookingStatus | "all"; label: string }[] = [
    { value: "all", label: t("filterAll") },
    { value: "pending", label: t("filterPending") },
    { value: "confirmed", label: t("filterConfirmed") },
    { value: "cancelled", label: t("filterCancelled") },
  ]

  const { status: statusParam } = await searchParams
  const activeFilter = (STATUS_FILTERS.find((f) => f.value === statusParam)?.value ?? "all") as BookingStatus | "all"

  const allBookings = await db.query.bookings.findMany({
    where: activeFilter !== "all" ? eq(bookings.status, activeFilter) : undefined,
    orderBy: [desc(bookings.createdAt)],
    limit: PAGINATION_DEFAULT,
    with: { user: true, service: true },
  })

  const statusVariant: Record<BookingStatus, "yellow" | "teal" | "slate"> = {
    pending: "yellow",
    confirmed: "teal",
    cancelled: "slate",
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={t("description")} />

      <FilterTabs
        tabs={STATUS_FILTERS}
        active={activeFilter}
        href={(value) => value === "all" ? "/admin/bookings" : `/admin/bookings?status=${value}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {activeFilter === "all" ? t("allBookings") : `${STATUS_FILTERS.find((f) => f.value === activeFilter)?.label} Bookings`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">{t("client")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("service")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("dateTime")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("status")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("created")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <p className="font-medium text-slate-800">{booking.user.name ?? "—"}</p>
                    <p className="text-xs text-slate-400">{booking.user.email}</p>
                  </td>
                  <td className="py-3 text-slate-700">{booking.service.name}</td>
                  <td className="py-3 text-slate-500">
                    {booking.preferredDate ? (
                      <>
                        <span>{booking.preferredDate}</span>
                        {booking.preferredTime && (
                          <span className="text-xs text-slate-400 ml-1">({booking.preferredTime})</span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <Badge
                      label={STATUS_FILTERS.find((f) => f.value === booking.status)?.label ?? booking.status}
                      variant={statusVariant[booking.status]}
                    />
                  </td>
                  <td className="py-3 text-slate-400 text-xs">{formatDate(booking.createdAt)}</td>
                  <td className="py-3">
                    <BookingActions bookingId={booking.id} currentStatus={booking.status} />
                  </td>
                </tr>
              ))}
              {allBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t("noBookings")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
