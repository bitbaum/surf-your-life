import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { services, bookings } from "@/lib/db/schema"
import { eq, desc, asc, count } from "drizzle-orm"
import { PAGINATION_DEFAULT, SERVICES_MAX_LIMIT } from "@/lib/constants"
import { computeTotalPages, parsePagination } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { BookingGrid } from "./booking-grid"
import { BookingList } from "./booking-list"

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.book")
  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)
  const userId = session.user.id

  const { page: pageParam } = await searchParams
  const { page, offset } = parsePagination(pageParam)

  const [availableServices, userBookings, totalResult] = await Promise.all([
    db.select().from(services).where(eq(services.available, true)).orderBy(asc(services.sortOrder)).limit(SERVICES_MAX_LIMIT),
    db.query.bookings.findMany({
      where: eq(bookings.userId, userId),
      orderBy: [desc(bookings.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
      with: { service: true },
    }),
    db.select({ value: count() }).from(bookings).where(eq(bookings.userId, userId)),
  ])

  const total = totalResult[0]?.value ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <BookingGrid services={availableServices} />
      <BookingList bookings={userBookings} />
      <Pagination page={page} totalPages={totalPages} pageLink={(p) => `/book?page=${p}`} />
    </div>
  )
}
