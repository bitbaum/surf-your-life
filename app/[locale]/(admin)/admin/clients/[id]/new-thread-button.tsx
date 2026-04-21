"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { MessageSquare, X } from "lucide-react"

export function NewThreadButton({ clientId }: { clientId: string }) {
  const router = useRouter()
  const t = useTranslations("admin.clients.newThread")
  const [open, setOpen] = useState(false)
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
        body: JSON.stringify({ ...form, clientId }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(typeof json.error === "string" ? json.error : t("failedToSend"))
      router.push(`/admin/messages/${json.data.threadId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSend"))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MessageSquare className="w-4 h-4 mr-2" />
        {t("button")}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={t("close")}
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">{t("subjectLabel")}</label>
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
                <label className="text-sm font-medium text-slate-700">{t("messageLabel")}</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder={t("messagePlaceholder")}
                  rows={4}
                  required
                  disabled={sending}
                  maxLength={5000}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none disabled:opacity-50"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={sending}>
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={sending}>
                  {sending ? t("sending") : t("send")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
