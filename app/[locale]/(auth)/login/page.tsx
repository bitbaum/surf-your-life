"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter, Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GoogleButton } from "@/components/auth/google-button"

export default function LoginPage() {
  const t = useTranslations("auth.login")
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.error) {
      setError(t("errorInvalid"))
      setLoading(false)
      return
    }

    router.push("/dashboard")
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
          <Input label={t("email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input label={t("password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-teal-600 hover:underline">{t("forgotPassword")}</Link>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("loading") : t("submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          {t("noAccount")}{" "}
          <Link href="/register" className="text-teal-600 hover:underline font-medium">{t("getStarted")}</Link>
        </p>
      </CardContent>
    </Card>
  )
}
