import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "admin" | "practitioner" | "client"
      emailVerified: Date | null
    } & DefaultSession["user"]
  }
}
