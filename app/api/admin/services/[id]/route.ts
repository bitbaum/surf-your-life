import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { serviceUpdateSchema } from "@/lib/domain/services"
import { eq } from "drizzle-orm"
import { notFound, okData, parseBody, requireStaffAuth } from "@/lib/api"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params

  const result = await parseBody(req, serviceUpdateSchema)
  if (!result.ok) return result.response

  const [updated] = await db
    .update(services)
    .set(result.data)
    .where(eq(services.id, id))
    .returning()

  if (!updated) return notFound()

  return okData(updated)
}
