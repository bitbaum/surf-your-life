"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function VerifyContent() {
  const t = useTranslations("auth.verifyEmail")
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!token || !email) {
      setStatus("error")
      setErrorMsg(t("invalid"))
      return
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus("success")
        } else {
          const data = await res.json().catch(() => ({}))
          setErrorMsg(data.error ?? t("invalid"))
          setStatus("error")
        }
      })
      .catch(() => {
        setErrorMsg(t("invalid"))
        setStatus("error")
      })
  }, [token, email, t])

  if (status === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("body")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === "success") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("success")}</CardTitle>
          <CardDescription>{t("successBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard">
            <Button className="w-full">{t("goToDashboard")}</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{errorMsg || t("invalid")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/dashboard">
          <Button variant="outline" className="w-full">{t("goToDashboard")}</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  )
}
