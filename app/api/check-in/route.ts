import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"

const schema = z.object({
  mood: z.enum(["very_low", "low", "neutral", "good", "excellent"]),
  energyLevel: z.number().int().min(1).max(10),
  sleepHours: z.number().int().min(0).max(24).nullable().optional(),
  notes: z.string().max(2000).optional(),
  wins: z.string().max(1000).optional(),
  challenges: z.string().max(1000).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  await db.insert(checkIns).values({ ...parsed.data, userId: session.user.id })

  return NextResponse.json({ success: true }, { status: 201 })
}
