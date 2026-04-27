import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { assignments } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { requireStaffAuth, ok } from "@/lib/api"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params

  await db
    .update(assignments)
    .set({ active: false })
    .where(and(eq(assignments.id, id), eq(assignments.active, true)))

  return ok()
}
