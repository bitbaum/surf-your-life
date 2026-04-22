import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const patchSchema = z.object({
  status: z.enum(["new", "contacted", "dismissed"]),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
  }

  const [updated] = await db
    .update(leads)
    .set({ status: parsed.data.status })
    .where(eq(leads.id, id))
    .returning({ id: leads.id, status: leads.status })

  if (!updated) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: updated })
}
