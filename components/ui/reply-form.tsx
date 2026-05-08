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
      if (!json.success) throw new Error(json.error ?? t("failedToSend"))
      setBody("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSend"))
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
        className="w-full rounded-element border border-border px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-ring resize-none disabled:opacity-50"
      />
      {error && <p className="text-xs text-error">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={sending || !body.trim()} size="sm">
          {sending ? t("sending") : t("sendReply")}
        </Button>
      </div>
    </form>
  )
}
