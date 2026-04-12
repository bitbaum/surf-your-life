import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { services, bookings } from "@/lib/db/schema"
import { eq, desc, asc } from "drizzle-orm"
import { PageHeader } from "@/components/ui/page-header"
import { BookingGrid } from "./booking-grid"
import { BookingList } from "./booking-list"

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.book")
  const session = await auth()
  const userId = session!.user!.id!

  const [availableServices, userBookings] = await Promise.all([
    db.select().from(services).where(eq(services.available, true)).orderBy(asc(services.sortOrder)),
    db.query.bookings.findMany({
      where: eq(bookings.userId, userId),
      orderBy: [desc(bookings.createdAt)],
      with: { service: true },
    }),
  ])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <BookingGrid services={availableServices} />
      <BookingList bookings={userBookings} />
    </div>
  )
}
