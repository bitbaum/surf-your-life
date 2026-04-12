import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, profiles } from "@/lib/db/schema"
import { registerSchema } from "@/lib/domain/auth"

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists" },
      { status: 409 }
    )
  }

  const hashed = await bcrypt.hash(password, 12)
  const [user] = await db
    .insert(users)
    .values({ email, password: hashed, role: "client" })
    .returning({ id: users.id })

  // Create empty profile
  await db.insert(profiles).values({ userId: user.id })

  return NextResponse.json({ success: true }, { status: 201 })
}
