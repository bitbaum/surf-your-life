import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { bookings, services } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { createBookingSchema } from "@/lib/domain/booking"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const data = await db.query.bookings.findMany({
    where: eq(bookings.userId, session.user.id),
    orderBy: [desc(bookings.createdAt)],
    with: { service: true },
  })

  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const service = await db.query.services.findFirst({
    where: eq(services.id, parsed.data.serviceId),
  })
  if (!service || !service.available) {
    return NextResponse.json({ success: false, error: "Service not available" }, { status: 404 })
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      userId: session.user.id,
      serviceId: parsed.data.serviceId,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      notes: parsed.data.notes,
    })
    .returning({ id: bookings.id })

  return NextResponse.json({ success: true, data: { id: booking.id } }, { status: 201 })
}
