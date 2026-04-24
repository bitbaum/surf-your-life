import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, roleEnum } from "@/lib/db/schema"
import { ADMIN_ROLE } from "@/lib/domain/auth"
import { API_ERR_FORBIDDEN, API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED, API_ERR_NOT_FOUND, API_ERR_SELF_ROLE_CHANGE } from "@/lib/constants"

const bodySchema = z.object({
  role: z.enum(roleEnum.enumValues),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }
  if (session.user.role !== ADMIN_ROLE) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json(
      { success: false, error: API_ERR_SELF_ROLE_CHANGE },
      { status: 400 }
    )
  }

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: API_ERR_INVALID_INPUT },
      { status: 400 }
    )
  }

  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, role: users.role })

  if (!updated) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: updated })
}
