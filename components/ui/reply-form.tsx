"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export function ReplyForm({ threadId }: { threadId: string }) {
  const t = useTranslations("messages")
  const router = useRouter()
  const [body, setBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? "Failed to send")
      setBody("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("replyPlaceholder")}
        rows={3}
        disabled={sending}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none disabled:opacity-50"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={sending || !body.trim()} size="sm">
          {sending ? t("sending") : t("sendReply")}
        </Button>
      </div>
    </form>
  )
}
