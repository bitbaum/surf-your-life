"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DeleteAccountForm() {
  const t = useTranslations("portal.settings")
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
      } else {
        router.push("/")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">{t("deleteTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-4">{t("deleteBody")}</p>
        <p className="text-sm font-medium text-red-700 mb-4">{t("deleteWarning")}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label={t("deleteConfirm")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="self-start bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500"
          >
            {loading ? t("deleting") : t("deleteButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
