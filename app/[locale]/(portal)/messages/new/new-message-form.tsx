"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export function NewMessageForm() {
  const t = useTranslations("messages")
  const router = useRouter()
  const [form, setForm] = useState({ subject: "", body: "" })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(typeof json.error === "string" ? json.error : "Failed to send")
      router.push(`/messages/${json.data.threadId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">{t("subject")}</label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder={t("subjectPlaceholder")}
          required
          disabled={sending}
          maxLength={200}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-700">{t("message")}</label>
        <textarea
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder={t("messagePlaceholder")}
          rows={5}
          required
          disabled={sending}
          maxLength={5000}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none disabled:opacity-50"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={sending}>
          {sending ? t("sending") : t("send")}
        </Button>
      </div>
    </form>
  )
}
