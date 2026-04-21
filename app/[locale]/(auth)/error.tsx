"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function AuthError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common")

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">{t("error")}</h2>
        <p className="text-sm text-slate-500 mb-6">{t("errorDescription")}</p>
        <Button onClick={reset}>{t("tryAgain")}</Button>
      </div>
    </div>
  )
}
