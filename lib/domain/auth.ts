import { z } from "zod"
import { PASSWORD_MIN_LENGTH } from "@/lib/constants"

export const ADMIN_ROLE = "admin" as const
export const PRACTITIONER_ROLE = "practitioner" as const
export const CLIENT_ROLE = "client" as const

export const STAFF_ROLES = [ADMIN_ROLE, PRACTITIONER_ROLE] as const
export type StaffRole = (typeof STAFF_ROLES)[number]
export type AdminRole = typeof ADMIN_ROLE
export type PractitionerRole = typeof PRACTITIONER_ROLE
export type ClientRole = typeof CLIENT_ROLE
export type AppRole = AdminRole | PractitionerRole | ClientRole

/** Returns true when a user has staff-level access (admin or practitioner). */
export function isStaff(role: string | undefined | null): boolean {
  return role != null && (STAFF_ROLES as readonly string[]).includes(role)
}

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
})

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

export function resolveRole(email: string): AdminRole | ClientRole {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return adminEmails.includes(email.toLowerCase()) ? "admin" : "client"
}
