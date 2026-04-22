import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { bookings, services, users } from "@/lib/db/schema"
import { and, eq, desc, inArray } from "drizzle-orm"
import { createBookingSchema } from "@/lib/domain/booking"
import { STAFF_ROLES } from "@/lib/domain/auth"
import { sendEmail } from "@/lib/email"
import { bookingNotificationEmail, bookingRequestEmail } from "@/lib/email/templates"

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

  // Prevent duplicate active bookings for the same service by the same user
  const existingOwn = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.userId, session.user.id),
      eq(bookings.serviceId, parsed.data.serviceId),
      inArray(bookings.status, ["pending", "confirmed"])
    ),
  })
  if (existingOwn) {
    return NextResponse.json(
      { success: false, error: "You already have an active booking for this service" },
      { status: 409 }
    )
  }

  // Prevent slot conflicts: block if another client already holds the same date+time
  if (parsed.data.preferredDate && parsed.data.preferredTime) {
    const slotTaken = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.serviceId, parsed.data.serviceId),
        eq(bookings.preferredDate, parsed.data.preferredDate),
        eq(bookings.preferredTime, parsed.data.preferredTime),
        inArray(bookings.status, ["pending", "confirmed"])
      ),
    })
    if (slotTaken) {
      return NextResponse.json(
        { success: false, error: "This time slot is no longer available. Please choose another." },
        { status: 409 }
      )
    }
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

  // Notify all admins and practitioners — fire-and-forget, never block the response
  const adminUsers = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.role, STAFF_ROLES))

  if (adminUsers.length > 0) {
    const html = bookingNotificationEmail({
      clientEmail: session.user.email!,
      clientName: session.user.name ?? null,
      service,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime ?? null,
      notes: parsed.data.notes ?? null,
      bookingId: booking.id,
    })

    Promise.all(
      adminUsers.map((admin) =>
        sendEmail({
          to: admin.email,
          subject: `New booking: ${service.name}`,
          html,
        }).catch((err) => console.error("[booking-notify]", err))
      )
    )
  }

  // Confirm to the client — fire-and-forget
  void sendEmail({
    to: session.user.email!,
    subject: `Booking request received: ${service.name}`,
    html: bookingRequestEmail({
      clientName: session.user.name ?? null,
      serviceName: service.name,
      preferredDate: parsed.data.preferredDate ?? null,
      preferredTime: parsed.data.preferredTime ?? null,
    }),
  }).catch((e) => console.error("[booking-request-confirm]", e))

  return NextResponse.json({ success: true, data: { id: booking.id } }, { status: 201 })
}
