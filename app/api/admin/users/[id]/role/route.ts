import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, roleEnum } from "@/lib/db/schema"
import { ADMIN_ROLE } from "@/lib/domain/auth"
import { API_ERR_SELF_ROLE_CHANGE } from "@/lib/constants"
import { forbidden, notFound, okData, parseBody, requireStaffAuth } from "@/lib/api"

const bodySchema = z.object({
  role: z.enum(roleEnum.enumValues),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult
  if (session.user.role !== ADMIN_ROLE) {
    return forbidden()
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json(
      { success: false, error: API_ERR_SELF_ROLE_CHANGE },
      { status: 400 }
    )
  }

  const result = await parseBody(req, bodySchema)
  if (!result.ok) return result.response

  const [updated] = await db
    .update(users)
    .set({ role: result.data.role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, role: users.role })

  if (!updated) {
    return notFound()
  }

  return okData(updated)
}
