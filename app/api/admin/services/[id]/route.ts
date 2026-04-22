import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { serviceUpdateSchema } from "@/lib/domain/services"
import { isStaff } from "@/lib/domain/auth"
import { eq } from "drizzle-orm"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const body = await req.json()
  const parsed = serviceUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const [updated] = await db
    .update(services)
    .set(parsed.data)
    .where(eq(services.id, id))
    .returning()

  if (!updated) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

  return NextResponse.json({ success: true, data: updated })
}
