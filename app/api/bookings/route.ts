import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, services, users } from "@/lib/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import { createBookingSchema } from "@/lib/domain/booking";
import { STAFF_ROLES } from "@/lib/domain/auth";
import {
  PAGINATION_DEFAULT,
  API_ERR_SERVICE_UNAVAILABLE,
  API_ERR_BOOKING_DUPLICATE,
  API_ERR_SLOT_TAKEN,
  ACTIVE_BOOKING_STATUSES,
} from "@/lib/constants";
import { created, parseBody, requireAuth } from "@/lib/api";
import { sendEmail, sendEmailFire } from "@/lib/email";
import { bookingNotificationEmail, bookingRequestEmail } from "@/lib/email/templates";

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  const data = await db.query.bookings.findMany({
    where: eq(bookings.userId, session.user.id),
    orderBy: [desc(bookings.createdAt)],
    limit: PAGINATION_DEFAULT,
    with: { service: true },
  });

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  const result = await parseBody(req, createBookingSchema);
  if (!result.ok) return result.response;

  const service = await db.query.services.findFirst({
    where: eq(services.id, result.data.serviceId),
  });
  if (!service || !service.available) {
    return NextResponse.json(
      { success: false, error: API_ERR_SERVICE_UNAVAILABLE },
      { status: 404 },
    );
  }

  // Prevent duplicate active bookings for the same service by the same user
  const existingOwn = await db.query.bookings.findFirst({
    where: and(
      eq(bookings.userId, session.user.id),
      eq(bookings.serviceId, result.data.serviceId),
      inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
    ),
  });
  if (existingOwn) {
    return NextResponse.json({ success: false, error: API_ERR_BOOKING_DUPLICATE }, { status: 409 });
  }

  // Prevent slot conflicts: block if another client already holds the same date+time
  if (result.data.preferredDate && result.data.preferredTime) {
    const slotTaken = await db.query.bookings.findFirst({
      where: and(
        eq(bookings.serviceId, result.data.serviceId),
        eq(bookings.preferredDate, result.data.preferredDate),
        eq(bookings.preferredTime, result.data.preferredTime),
        inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
      ),
    });
    if (slotTaken) {
      return NextResponse.json({ success: false, error: API_ERR_SLOT_TAKEN }, { status: 409 });
    }
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      userId: session.user.id,
      serviceId: result.data.serviceId,
      preferredDate: result.data.preferredDate,
      preferredTime: result.data.preferredTime,
      notes: result.data.notes,
    })
    .returning({ id: bookings.id });

  // Notify all admins and practitioners — fire-and-forget, never block the response
  const adminUsers = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(inArray(users.role, STAFF_ROLES));

  if (adminUsers.length > 0) {
    const html = bookingNotificationEmail({
      clientEmail: session.user.email!,
      clientName: session.user.name ?? null,
      service,
      preferredDate: result.data.preferredDate,
      preferredTime: result.data.preferredTime ?? null,
      notes: result.data.notes ?? null,
      bookingId: booking.id,
    });

    void Promise.all(
      adminUsers.map((admin) =>
        sendEmail({
          to: admin.email,
          subject: `New booking: ${service.name}`,
          html,
        }).catch((err) => console.error("[booking-notify]", err)),
      ),
    );
  }

  // Confirm to the client — fire-and-forget
  sendEmailFire(
    {
      to: session.user.email!,
      subject: `Booking request received: ${service.name}`,
      html: bookingRequestEmail({
        clientName: session.user.name ?? null,
        serviceName: service.name,
        preferredDate: result.data.preferredDate ?? null,
        preferredTime: result.data.preferredTime ?? null,
      }),
    },
    "booking-request-confirm",
  );

  return created({ id: booking.id });
}
