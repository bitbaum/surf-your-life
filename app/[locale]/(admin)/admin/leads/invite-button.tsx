"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Mail } from "lucide-react"

interface Props {
  leadId: string
  currentStatus: "new" | "contacted" | "dismissed"
}

export function InviteButton({ leadId, currentStatus }: Props) {
  const t = useTranslations("admin.leads")
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleInvite() {
    if (loading || sent) return
    setLoading(true)
    const res = await fetch(`/api/admin/leads/${leadId}/invite`, { method: "POST" })
    if (res.ok) {
      setSent(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (currentStatus === "dismissed") return null

  return (
    <button
      onClick={handleInvite}
      disabled={loading || sent}
      title={t("invite")}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        sent
          ? "bg-teal-50 text-teal-700 border border-teal-200"
          : "bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200"
      }`}
    >
      <Mail className="w-3.5 h-3.5" />
      {loading ? t("inviting") : sent ? t("inviteSent") : t("invite")}
    </button>
  )
}
