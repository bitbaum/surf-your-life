import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { isStaff, CLIENT_ROLE } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { bookings, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmailFire } from "@/lib/email"
import { bookingStatusEmail } from "@/lib/email/templates"
import { API_ERR_FORBIDDEN, API_ERR_UNAUTHORIZED, API_ERR_NOT_FOUND, API_ERR_BOOKING_ALREADY_CANCELLED } from "@/lib/constants"
import { parseBody } from "@/lib/api"

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

  const bodySchema = isAdmin ? adminUpdateSchema : clientUpdateSchema
  const result = await parseBody(req, bodySchema)
  if (!result.ok) return result.response

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
    .set({ status: result.data.status })
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
      status: result.data.status,
      preferredDate: booking.preferredDate ?? null,
      preferredTime: booking.preferredTime ?? null,
    })

    const subject =
      result.data.status === "confirmed"
        ? `Booking confirmed: ${booking.service.name}`
        : `Booking cancelled: ${booking.service.name}`

    sendEmailFire({ to: client.email, subject, html }, "booking-status-notify")
  }

  return NextResponse.json({ success: true, data: updated })
}
