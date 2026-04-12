import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"

export async function GET() {
  const data = await db
    .select()
    .from(services)
    .where(eq(services.available, true))
    .orderBy(asc(services.sortOrder))

  return NextResponse.json({ success: true, data })
}
