import { z } from "zod"
import { db } from "@/lib/db"
import { verificationTokens, users } from "@/lib/db/schema"
import { and, eq, gt } from "drizzle-orm"

export const STAFF_ROLES = ["admin", "practitioner"] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export const CLIENT_ROLE = "client" as const
export type ClientRole = typeof CLIENT_ROLE

/** Returns true when a user has staff-level access (admin or practitioner). */
export function isStaff(role: string | undefined | null): boolean {
  return role === "admin" || role === "practitioner"
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

export function resolveRole(email: string): "admin" | "client" {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase()) ? "admin" : "client"
}

export async function verifyEmailToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const now = new Date()
  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, now)
    ),
  })

  if (!record) {
    return { success: false, error: "invalid" }
  }

  // Mark user as verified
  await db
    .update(users)
    .set({ emailVerified: now })
    .where(eq(users.email, record.identifier))

  // Delete the used token
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, record.identifier),
        eq(verificationTokens.token, token)
      )
    )

  return { success: true }
}
