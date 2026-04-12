"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("Passwords don't match")
      return
    }
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Invalid or expired link")
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push("/login"), 2000)
  }

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This reset link is missing or invalid.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password">
            <Button className="w-full">Request a new link</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password updated</CardTitle>
          <CardDescription>Redirecting you to sign in…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Choose a password with at least 8 characters</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
