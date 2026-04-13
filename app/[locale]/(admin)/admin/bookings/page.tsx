import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { BookingActions } from "./booking-actions"
import { cn } from "@/lib/utils"

type BookingStatus = "pending" | "confirmed" | "cancelled"

const STATUS_FILTERS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
]

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    confirmed: "bg-teal-50 text-teal-700 border border-teal-200",
    cancelled: "bg-slate-100 text-slate-500 border border-slate-200",
  }
  const labels: Record<BookingStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
  }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  )
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusParam } = await searchParams
  const activeFilter = (STATUS_FILTERS.find((f) => f.value === statusParam)?.value ?? "all") as BookingStatus | "all"

  const allBookings = await db.query.bookings.findMany({
    where: activeFilter !== "all" ? eq(bookings.status, activeFilter) : undefined,
    orderBy: [desc(bookings.createdAt)],
    limit: PAGINATION_DEFAULT,
    with: { user: true, service: true },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Bookings" description="Manage all client booking requests" />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <Link
            key={value}
            href={value === "all" ? "/admin/bookings" : `/admin/bookings?status=${value}`}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border",
              activeFilter === value
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeFilter === "all" ? "All Bookings" : `${STATUS_FILTERS.find((f) => f.value === activeFilter)?.label} Bookings`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">Client</th>
                <th className="text-left py-2 font-medium text-slate-500">Service</th>
                <th className="text-left py-2 font-medium text-slate-500">Date / Time</th>
                <th className="text-left py-2 font-medium text-slate-500">Status</th>
                <th className="text-left py-2 font-medium text-slate-500">Created</th>
                <th className="text-left py-2 font-medium text-slate-500">Actions</th>
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
                    <StatusBadge status={booking.status} />
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
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
