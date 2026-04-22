import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assignments } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { isStaff } from "@/lib/domain/auth"
import { API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"

const assignSchema = z.object({
  clientId: z.string().uuid(),
  practitionerId: z.string().uuid(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const body = await req.json()
  const parsed = assignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { clientId, practitionerId } = parsed.data

  // Deactivate any existing active assignment for this client
  await db
    .update(assignments)
    .set({ active: false })
    .where(and(eq(assignments.clientId, clientId), eq(assignments.active, true)))

  // Create new assignment
  const [created] = await db
    .insert(assignments)
    .values({ clientId, practitionerId })
    .returning({ id: assignments.id })

  return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
}
