import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { isStaff, CLIENT_ROLE } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { bookings, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { bookingStatusEmail } from "@/lib/email/templates"
import { API_ERR_FORBIDDEN, API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED, API_ERR_NOT_FOUND, API_ERR_BOOKING_ALREADY_CANCELLED } from "@/lib/constants"

const adminUpdateSchema = z.object({ status: z.enum(["confirmed", "cancelled"]) })
const clientUpdateSchema = z.object({ status: z.literal("cancelled") })

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const isAdmin = isStaff(session.user.role)
  const isClient = session.user.role === CLIENT_ROLE

  const body = await req.json()
  const schema = isAdmin ? adminUpdateSchema : clientUpdateSchema
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { id } = await params

  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: { user: true, service: true },
  })

  if (!booking) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  // Clients can only cancel their own bookings; cannot act on already-cancelled ones
  if (isClient) {
    if (booking.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
    }
    if (booking.status === "cancelled") {
      return NextResponse.json({ success: false, error: API_ERR_BOOKING_ALREADY_CANCELLED }, { status: 400 })
    }
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: parsed.data.status })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id, status: bookings.status })

  // Send status email to the client — fire-and-forget
  const client = await db.query.users.findFirst({
    where: eq(users.id, booking.userId),
  })

  if (client?.email) {
    const html = bookingStatusEmail({
      clientName: client.name ?? null,
      serviceName: booking.service.name,
      status: parsed.data.status,
      preferredDate: booking.preferredDate ?? null,
      preferredTime: booking.preferredTime ?? null,
    })

    const subject =
      parsed.data.status === "confirmed"
        ? `Booking confirmed: ${booking.service.name}`
        : `Booking cancelled: ${booking.service.name}`

    void sendEmail({ to: client.email, subject, html }).catch((err) =>
      console.error("[booking-status-notify]", err)
    )
  }

  return NextResponse.json({ success: true, data: updated })
}
