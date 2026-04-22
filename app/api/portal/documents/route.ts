import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { DOCUMENTS_PER_CLIENT_LIMIT } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const docs = await db.query.documents.findMany({
    where: eq(documents.userId, session.user.id),
    orderBy: [desc(documents.createdAt)],
    limit: DOCUMENTS_PER_CLIENT_LIMIT,
    with: { author: { columns: { name: true } } },
  })

  return NextResponse.json({ success: true, data: docs })
}
