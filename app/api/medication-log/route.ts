import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { medicationLog } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { medicationEntrySchema } from "@/lib/domain/clinical"
import { PAGINATION_DEFAULT } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const data = await db.query.medicationLog.findMany({
    where: eq(medicationLog.userId, session.user.id),
    orderBy: [desc(medicationLog.createdAt)],
    limit: PAGINATION_DEFAULT,
  })

  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = medicationEntrySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const [created] = await db
    .insert(medicationLog)
    .values({ ...parsed.data, userId: session.user.id })
    .returning({ id: medicationLog.id })

  return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
}
