import { db } from "@/lib/db"
import { bookings } from "@/lib/db/schema"
import { and, gte, lte, ne } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate, localDateString, addDaysISO } from "@/lib/utils"

// Returns the Monday of the ISO week containing `isoDate` as a "YYYY-MM-DD".
// Day-of-week is intrinsic to a calendar date, so UTC-anchoring is fine here.
function startOfWeekStr(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Mon = 1
  return addDaysISO(isoDate, diff)
}


const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 border-amber-200 text-amber-900",
  confirmed: "bg-teal-50 border-teal-200 text-teal-900",
  cancelled: "bg-slate-100 border-slate-200 text-slate-400 line-through",
}

export default async function BookingCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ week?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.bookings")

  const { week: weekParam } = await searchParams
  // Anchor at clinic-local today so "this week" matches the admin's wall clock,
  // not UTC. `weekParam` is already a "YYYY-MM-DD" from the prev/next/today links.
  const todayISO = localDateString(new Date())
  const weekStart = startOfWeekStr(weekParam ?? todayISO)
  const weekEnd = addDaysISO(weekStart, 6)

  const weekBookings = await db.query.bookings.findMany({
    where: and(
      gte(bookings.preferredDate, weekStart),
      lte(bookings.preferredDate, weekEnd),
      ne(bookings.status, "cancelled"),
    ),
    with: { user: true, service: true },
    orderBy: (b, { asc }) => [asc(b.preferredDate)],
  })

  // Group by date
  const byDate = new Map<string, typeof weekBookings>()
  for (let i = 0; i < 7; i++) {
    byDate.set(addDaysISO(weekStart, i), [])
  }
  for (const b of weekBookings) {
    if (b.preferredDate) {
      byDate.get(b.preferredDate)?.push(b)
    }
  }

  const prevWeek = addDaysISO(weekStart, -7)
  const nextWeek = addDaysISO(weekStart, 7)

  const DAY_NAMES = t.raw("dayNames") as string[]

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={t("calendarView")}
        description={t("weekOf", { date: formatDate(weekStart) })}
        action={
          <Link href="/admin/bookings" className="text-sm text-teal-600 hover:underline">
            {t("listView")} →
          </Link>
        }
      />

      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/bookings/calendar?week=${prevWeek}`}
          className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          {t("prevWeek")}
        </Link>
        <Link
          href={`/admin/bookings/calendar?week=${todayISO}`}
          className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors font-medium"
        >
          {t("today")}
        </Link>
        <Link
          href={`/admin/bookings/calendar?week=${nextWeek}`}
          className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
        >
          {t("nextWeek")}
        </Link>
      </div>

      {/* 7-column week grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from(byDate.entries()).map(([dateStr, dayBookings], i) => {
          const isToday = dateStr === todayISO
          return (
            <div key={dateStr} className="flex flex-col min-h-32">
              {/* Day header */}
              <div
                className={`text-center py-2 rounded-t-lg text-xs font-semibold mb-1 ${
                  isToday
                    ? "bg-teal-600 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <div>{DAY_NAMES[i]}</div>
                <div className={`text-base font-bold ${isToday ? "text-white" : "text-slate-800"}`}>
                  {new Date(dateStr + "T00:00:00Z").getUTCDate()}
                </div>
              </div>

              {/* Bookings */}
              <div className="flex flex-col gap-1 flex-1">
                {dayBookings.length === 0 ? (
                  <p className="text-xs text-slate-300 text-center mt-3">{t("noBookingsDay")}</p>
                ) : (
                  dayBookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/clients/${b.userId}`}
                      className={`block text-xs rounded-lg border px-2 py-1.5 leading-tight hover:opacity-80 transition-opacity ${STATUS_STYLES[b.status] ?? STATUS_STYLES.pending}`}
                    >
                      <p className="font-medium truncate">{b.user.name ?? b.user.email}</p>
                      <p className="truncate opacity-70">{b.service.name}</p>
                      {b.preferredTime && (
                        <p className="opacity-60 mt-0.5">
                          {t(`timePreference.${b.preferredTime}` as Parameters<typeof t>[0])}
                        </p>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200 inline-block" />
          {t("filterPending")}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-teal-100 border border-teal-200 inline-block" />
          {t("filterConfirmed")}
        </span>
      </div>
    </div>
  )
}
