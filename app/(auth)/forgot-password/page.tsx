"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline" className="w-full">Back to sign in</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? "Sending…" : "Send reset link"}
          </Button>
          <Link href="/login">
            <Button variant="ghost" className="w-full">Back to sign in</Button>
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}
