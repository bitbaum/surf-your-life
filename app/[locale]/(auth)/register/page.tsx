"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter, Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GoogleButton } from "@/components/auth/google-button"

export default function RegisterPage() {
  const t = useTranslations("auth.register")
  const router = useRouter()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? t("errorGeneric"))
      setLoading(false)
      return
    }

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (signInRes?.error) {
      setError(t("errorGeneric"))
      setLoading(false)
      return
    }

    // Send new users straight to profile to complete onboarding
    router.push("/profile")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <GoogleButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">{t("or")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" required />
          <Input label={t("password")} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={t("passwordPlaceholder")} required minLength={8} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-1">
            {loading ? t("loading") : t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-teal-600 hover:underline font-medium">{t("signIn")}</Link>
        </p>
      </CardContent>
    </Card>
  )
}
