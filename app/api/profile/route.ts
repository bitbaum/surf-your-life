import { NextResponse } from "next/server"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"

const schema = z.object({
  occupation: z.string().max(200).optional(),
  dateOfBirth: z.string().optional(),
  mainConcern: z.string().max(100).optional(),
  currentSituation: z.string().max(5000).optional(),
  goals: z.string().max(5000).optional(),
  previousTherapy: z.boolean().optional(),
  medications: z.string().max(1000).optional(),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  stressLevel: z.number().int().min(1).max(10).optional(),
  exerciseFrequency: z.string().max(200).optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  return NextResponse.json({ success: true, profile })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  return NextResponse.json({ success: true })
}
