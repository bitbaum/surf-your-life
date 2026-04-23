"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PASSWORD_MIN_LENGTH } from "@/lib/constants"

export function SecurityForm() {
  const t = useTranslations("auth.changePassword")
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSuccess(false)
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (form.newPassword !== form.confirmPassword) {
      setError(t("mismatch"))
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t("wrongCurrent"))
      } else {
        setSuccess(true)
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t("current")}
            type="password"
            value={form.currentPassword}
            onChange={(e) => set("currentPassword", e.target.value)}
            required
          />
          <div>
            <Input
              label={t("new")}
              type="password"
              value={form.newPassword}
              onChange={(e) => set("newPassword", e.target.value)}
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
            <PasswordStrength password={form.newPassword} />
          </div>
          <Input
            label={t("confirm")}
            type="password"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-teal-600">{t("success")}</p>}
          <Button type="submit" disabled={loading} className="self-start">
            {loading ? t("saving") : t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
