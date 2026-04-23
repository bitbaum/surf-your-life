import { describe, it, expect, vi } from "vitest"

// auth.ts imports lib/db for verifyEmailToken; mock it so pure functions are
// testable without a real database connection string.
vi.mock("@/lib/db", () => ({ db: {} }))

import { isStaff, resolveRole, loginSchema, registerSchema } from "@/lib/domain/auth"
import { PASSWORD_MIN_LENGTH } from "@/lib/constants"

// ─── isStaff ─────────────────────────────────────────────────────────────────

describe("isStaff", () => {
  it("returns true for admin role", () => {
    expect(isStaff("admin")).toBe(true)
  })

  it("returns true for practitioner role", () => {
    expect(isStaff("practitioner")).toBe(true)
  })

  it("returns false for client role", () => {
    expect(isStaff("client")).toBe(false)
  })

  it("returns false for unknown roles", () => {
    expect(isStaff("superuser")).toBe(false)
    expect(isStaff("guest")).toBe(false)
    expect(isStaff("")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isStaff(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isStaff(undefined)).toBe(false)
  })
})

// ─── resolveRole ─────────────────────────────────────────────────────────────

describe("resolveRole", () => {
  it("returns 'client' when ADMIN_EMAILS is not set", () => {
    const original = process.env.ADMIN_EMAILS
    delete process.env.ADMIN_EMAILS
    expect(resolveRole("anyone@example.com")).toBe("client")
    process.env.ADMIN_EMAILS = original
  })

  it("returns 'admin' for an email in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "manu@clinic.com,admin@clinic.com"
    expect(resolveRole("manu@clinic.com")).toBe("admin")
    expect(resolveRole("admin@clinic.com")).toBe("admin")
  })

  it("returns 'client' for an email not in ADMIN_EMAILS", () => {
    process.env.ADMIN_EMAILS = "manu@clinic.com"
    expect(resolveRole("client@example.com")).toBe("client")
  })

  it("is case-insensitive", () => {
    process.env.ADMIN_EMAILS = "Manu@Clinic.com"
    expect(resolveRole("MANU@CLINIC.COM")).toBe("admin")
    expect(resolveRole("manu@clinic.com")).toBe("admin")
  })

  it("trims whitespace around emails in the env var", () => {
    process.env.ADMIN_EMAILS = " manu@clinic.com , admin@clinic.com "
    expect(resolveRole("manu@clinic.com")).toBe("admin")
  })

  it("returns 'client' when ADMIN_EMAILS is an empty string", () => {
    process.env.ADMIN_EMAILS = ""
    expect(resolveRole("anyone@example.com")).toBe("client")
  })
})

// ─── loginSchema ─────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "password123" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" })
    expect(result.success).toBe(false)
  })

  it(`rejects password shorter than ${PASSWORD_MIN_LENGTH} characters`, () => {
    const short = "a".repeat(PASSWORD_MIN_LENGTH - 1)
    const result = loginSchema.safeParse({ email: "user@example.com", password: short })
    expect(result.success).toBe(false)
  })

  it(`accepts password exactly ${PASSWORD_MIN_LENGTH} characters`, () => {
    const exact = "a".repeat(PASSWORD_MIN_LENGTH)
    const result = loginSchema.safeParse({ email: "user@example.com", password: exact })
    expect(result.success).toBe(true)
  })
})

// ─── registerSchema ───────────────────────────────────────────────────────────

describe("registerSchema", () => {
  it("accepts valid email and password", () => {
    const result = registerSchema.safeParse({ email: "new@example.com", password: "securepass" })
    expect(result.success).toBe(true)
  })

  it("rejects missing email", () => {
    const result = registerSchema.safeParse({ password: "securepass" })
    expect(result.success).toBe(false)
  })

  it("rejects missing password", () => {
    const result = registerSchema.safeParse({ email: "new@example.com" })
    expect(result.success).toBe(false)
  })
})
