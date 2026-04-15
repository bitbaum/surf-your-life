import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { medicationLog } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const patchSchema = z.object({
  endDate: z.string().optional().nullable(), // YYYY-MM-DD or null to clear
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const result = await db
    .update(medicationLog)
    .set({ endDate: parsed.data.endDate ?? null })
    .where(and(eq(medicationLog.id, id), eq(medicationLog.userId, session.user.id)))
    .returning({ id: medicationLog.id })

  if (result.length === 0) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  await db
    .delete(medicationLog)
    .where(and(eq(medicationLog.id, id), eq(medicationLog.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
