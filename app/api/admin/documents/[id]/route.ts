import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) })
  if (!doc) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  }

  // Only the author or an admin can delete
  if (doc.authorId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  await db.delete(documents).where(eq(documents.id, id))

  return NextResponse.json({ success: true })
}
