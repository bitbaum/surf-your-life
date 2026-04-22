"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

const DOC_TYPE_KEYS = {
  session_note: "typeSessionNote",
  assessment: "typeAssessment",
  report: "typeReport",
} as const

function typeBadgeClass(docType: string) {
  switch (docType) {
    case "assessment": return "bg-violet-50 text-violet-700 border-violet-200"
    case "report": return "bg-blue-50 text-blue-700 border-blue-200"
    default: return "bg-teal-50 text-teal-700 border-teal-200"
  }
}

interface Props {
  clientId: string
  onSaved: () => void
  onCancel: () => void
}

export function SessionNoteForm({ clientId, onSaved, onCancel }: Props) {
  const t = useTranslations("admin.clients.sessionNotes")
  const [type, setType] = useState<"session_note" | "assessment" | "report">("session_note")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title: title.trim() || undefined, content }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      onSaved()
    } catch {
      setError(t("error"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
      <div className="flex gap-2">
        {(["session_note", "assessment", "report"] as const).map((opt) => (
          <button key={opt} type="button" onClick={() => setType(opt)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${type === opt ? typeBadgeClass(opt) + " border" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
            {t(DOC_TYPE_KEYS[opt])}
          </button>
        ))}
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
          {t("titleLabel")} <span className="text-slate-400 font-normal normal-case">{t("optional")}</span>
        </label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("titlePlaceholder")} maxLength={200}
          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
          {t("contentLabel")} <span className="text-red-400">*</span>
        </label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={t("contentPlaceholder")} rows={5} required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving || !content.trim()}>{saving ? t("saving") : t("save")}</Button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">{t("cancel")}</button>
      </div>
    </form>
  )
}
