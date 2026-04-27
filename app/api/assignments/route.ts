import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assignments } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { parseBody, requireStaffAuth } from "@/lib/api"

const assignSchema = z.object({
  clientId: z.string().uuid(),
  practitionerId: z.string().uuid(),
})

export async function POST(req: Request) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, assignSchema)
  if (!result.ok) return result.response

  const { clientId, practitionerId } = result.data

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
