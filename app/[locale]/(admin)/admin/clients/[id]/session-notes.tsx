"use client"

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus } from "lucide-react"
import { SessionNoteForm } from "./session-note-form"
import { SessionNotesList, type DocWithAuthor } from "./session-notes-list"

interface Props {
  clientId: string
}

export function SessionNotes({ clientId }: Props) {
  const t = useTranslations("admin.clients.sessionNotes")
  const [docs, setDocs] = useState<DocWithAuthor[] | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
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

  function handleExpand() {
    if (!loaded) load()
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

  async function handleEdit(id: string, title: string, content: string) {
    const res = await fetch(`/api/admin/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    // Merge updated fields into local state — avoids a full reload
    setDocs((prev) => prev?.map((d) =>
      d.id === id ? { ...d, title: json.data.title, content: json.data.content, updatedAt: new Date(json.data.updatedAt) } : d
    ) ?? null)
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
            onClick={() => { setShowForm((v) => !v); handleExpand() }}
            className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("addNote")}
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {showForm && (
          <SessionNoteForm
            clientId={clientId}
            onSaved={() => { setShowForm(false); load() }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {!loaded && !showForm && (
          <button onClick={handleExpand} className="text-sm text-teal-600 hover:text-teal-700 transition-colors self-start">
            {t("loadNotes")}
          </button>
        )}

        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />)}
          </div>
        )}

        {loaded && !loading && docs !== null && (
          <SessionNotesList docs={docs} deleteError={deleteError} onDelete={handleDelete} onEdit={handleEdit} />
        )}
      </CardContent>
    </Card>
  )
}
