"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { KeyRound, Copy, Check } from "lucide-react"

export function ResetLinkButton({ userId }: { userId: string }) {
  const t = useTranslations("admin.clients.resetLink")
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    const res = await fetch(`/api/admin/reset-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    setLink(data.link)
    setLoading(false)
  }

  async function copy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (link) {
    return (
      <div className="flex flex-col gap-2 max-w-xs">
        <p className="text-xs text-slate-500">{t("linkExpiry")}</p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-slate-100 rounded px-2 py-1 flex-1 truncate">{link}</code>
          <button
            onClick={copy}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors"
            title={t("copyTitle")}
          >
            {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={generate} disabled={loading}>
      <KeyRound className="w-3.5 h-3.5" />
      {loading ? t("generating") : t("button")}
    </Button>
  )
}
