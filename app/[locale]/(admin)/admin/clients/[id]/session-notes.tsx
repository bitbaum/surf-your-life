"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Document } from "@/lib/db/schema"

type DocWithAuthor = Document & { author: { name: string | null } | null }

const DOC_TYPE_KEYS = {
  session_note: "typeSessionNote",
  assessment: "typeAssessment",
  report: "typeReport",
  upload: "typeUpload",
} as const

interface Props {
  clientId: string
}

export function SessionNotes({ clientId }: Props) {
  const t = useTranslations("admin.clients.sessionNotes")
  const [docs, setDocs] = useState<DocWithAuthor[] | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState<"session_note" | "assessment" | "report">("session_note")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [deleteError, setDeleteError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/documents`)
      const json = await res.json()
      if (json.success) setDocs(json.data)
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [clientId])

  // Lazy load — only fetch when the card is first expanded
  function handleExpand() {
    if (!loaded) load()
  }

  async function handleSave(e: React.FormEvent) {
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
      setShowForm(false)
      setTitle("")
      setContent("")
      setType("session_note")
      load()
    } catch {
      setError(t("error"))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteError("")
    try {
      const res = await fetch(`/api/admin/documents/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setDocs((prev) => prev?.filter((d) => d.id !== id) ?? null)
    } catch {
      setDeleteError(t("deleteError"))
    }
  }

  const typeLabel = (docType: string) =>
    t(DOC_TYPE_KEYS[docType as keyof typeof DOC_TYPE_KEYS] ?? "typeSessionNote")

  const typeBadgeClass = (docType: string) => {
    switch (docType) {
      case "assessment": return "bg-violet-50 text-violet-700 border-violet-200"
      case "report": return "bg-blue-50 text-blue-700 border-blue-200"
      default: return "bg-teal-50 text-teal-700 border-teal-200"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            {t("title")}
            {docs && docs.length > 0 && (
              <span className="text-sm font-normal text-slate-400">({docs.length})</span>
            )}
          </CardTitle>
          <button
            onClick={() => {
              setShowForm((v) => !v)
              handleExpand()
            }}
            className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("addNote")}
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {showForm && (
          <form onSubmit={handleSave} className="flex flex-col gap-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex gap-2">
              {(["session_note", "assessment", "report"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setType(opt)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    type === opt
                      ? typeBadgeClass(opt) + " border"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {t(DOC_TYPE_KEYS[opt])}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                {t("titleLabel")} <span className="text-slate-400 font-normal normal-case">{t("optional")}</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                maxLength={200}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1">
                {t("contentLabel")} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("contentPlaceholder")}
                rows={5}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={saving || !content.trim()}>
                {saving ? t("saving") : t("save")}
              </Button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError("") }}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        )}

        {!loaded && !showForm && (
          <button
            onClick={handleExpand}
            className="text-sm text-teal-600 hover:text-teal-700 transition-colors self-start"
          >
            {t("loadNotes")}
          </button>
        )}

        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
            ))}
          </div>
        )}

        {loaded && !loading && docs !== null && (
          <>
            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            {docs.length === 0 ? (
              <p className="text-sm text-slate-400">{t("noNotes")}</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {docs.map((doc) => (
                  <div key={doc.id} className="py-3 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${typeBadgeClass(doc.type)}`}>
                            {typeLabel(doc.type)}
                          </span>
                          <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                          {doc.author?.name && (
                            <span className="text-xs text-slate-400">· {doc.author.name}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                        <p className="text-sm text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{doc.content}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                        title={t("delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
