import { db } from "@/lib/db"
import { bookings, bookingStatusEnum } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate } from "@/lib/utils"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { BookingActions } from "./booking-actions"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { FilterTabs } from "@/components/ui/filter-tabs"
import { Pagination } from "@/components/ui/pagination"
import { Link } from "@/i18n/navigation"

type BookingStatus = (typeof bookingStatusEnum.enumValues)[number]

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ status?: string; page?: string }>
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

  const { status: statusParam, page: pageParam } = await searchParams
  const activeFilter = (STATUS_FILTERS.find((f) => f.value === statusParam)?.value ?? "all") as BookingStatus | "all"
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT
  const whereClause = activeFilter !== "all" ? eq(bookings.status, activeFilter) : undefined

  const [allBookings, totalResult] = await Promise.all([
    db.query.bookings.findMany({
      where: whereClause,
      orderBy: [desc(bookings.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
      with: { user: true, service: true },
    }),
    db.select({ value: count() }).from(bookings).where(whereClause),
  ])

  const total = totalResult[0]?.value ?? 0
  const totalPages = Math.ceil(total / PAGINATION_DEFAULT)

  const statusVariant: Record<BookingStatus, "yellow" | "teal" | "slate"> = {
    pending: "yellow",
    confirmed: "teal",
    cancelled: "slate",
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Link href="/admin/bookings/calendar" className="text-sm text-teal-600 hover:underline">
            {t("calendarView")} →
          </Link>
        }
      />

      <FilterTabs
        tabs={STATUS_FILTERS}
        active={activeFilter}
        href={(value) => value === "all" ? "/admin/bookings" : `/admin/bookings?status=${value}`}
      />


      <Card>
        <CardHeader>
          <CardTitle>
            {activeFilter === "all" ? t("allBookings") : STATUS_FILTERS.find((f) => f.value === activeFilter)?.label}
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
          <Pagination
            page={page}
            totalPages={totalPages}
            pageLink={(p) => activeFilter === "all" ? `/admin/bookings?page=${p}` : `/admin/bookings?status=${activeFilter}&page=${p}`}
          />
        </CardContent>
      </Card>
    </div>
  )
}
