import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { techniques } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { createTechniqueSchema } from "@/lib/domain/techniques"

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const rows = await db.query.techniques.findMany({
    where: eq(techniques.isActive, true),
    orderBy: [asc(techniques.category), asc(techniques.name)],
  })

  return Response.json({ success: true, data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "practitioner") {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const result = createTechniqueSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ success: false, error: result.error.flatten() }, { status: 400 })
  }

  const { resourceUrl, ...rest } = result.data
  const [technique] = await db
    .insert(techniques)
    .values({
      ...rest,
      resourceUrl: resourceUrl || null,
      createdBy: session.user.id,
    })
    .returning()

  return Response.json({ success: true, data: technique }, { status: 201 })
}
