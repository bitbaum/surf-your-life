import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  users,
  profiles,
  checkIns,
  bookings,
  threads,
  threadMessages,
  passwordResetTokens,
  verificationTokens,
  sessions,
  accounts,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const deleteSchema = z.object({
  password: z.string().min(1),
})

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = deleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Password required" }, { status: 400 })
  }

  const userId = session.user.id

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
  }

  if (!user.password) {
    return NextResponse.json(
      { success: false, error: "Password authentication not available" },
      { status: 400 }
    )
  }

  const valid = await bcrypt.compare(parsed.data.password, user.password)
  if (!valid) {
    return NextResponse.json({ success: false, error: "Incorrect password" }, { status: 403 })
  }

  // Delete in FK-safe order
  await db.delete(threadMessages).where(eq(threadMessages.senderId, userId))
  await db.delete(threads).where(eq(threads.clientId, userId))
  await db.delete(bookings).where(eq(bookings.userId, userId))
  await db.delete(checkIns).where(eq(checkIns.userId, userId))
  await db.delete(profiles).where(eq(profiles.userId, userId))
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId))
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, user.email))
  await db.delete(sessions).where(eq(sessions.userId, userId))
  await db.delete(accounts).where(eq(accounts.userId, userId))
  await db.delete(users).where(eq(users.id, userId))

  return NextResponse.json({ success: true })
}
