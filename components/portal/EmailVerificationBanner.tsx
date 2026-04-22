"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { X } from "lucide-react"

export function EmailVerificationBanner() {
  const t = useTranslations("auth")
  const [dismissed, setDismissed] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  if (dismissed) return null

  async function handleResend() {
    setLoading(true)
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 p-4 flex items-center justify-between gap-4">
      <p className="text-sm text-yellow-800">
        {sent ? t("resendSent") : t("unverifiedBanner")}
        {!sent && (
          <>
            {" "}
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-medium underline hover:text-yellow-900 disabled:opacity-50"
            >
              {loading ? "…" : t("resendVerification")}
            </button>
          </>
        )}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label={t("dismiss")}
        className="text-yellow-600 hover:text-yellow-800 flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}
