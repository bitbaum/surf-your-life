"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Trash2, ChevronDown, ChevronUp, Pencil, X, Check } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import type { Document } from "@/lib/db/schema"
import { DOC_TYPE_I18N_KEYS, DOC_TYPE_BADGE_CLASSES, FIELD_MAX_TITLE } from "@/lib/constants"

export type DocWithAuthor = Document & { author: { name: string | null } | null }

interface Props {
  docs: DocWithAuthor[]
  deleteError: string
  onDelete: (id: string) => void
  onEdit: (id: string, title: string, content: string) => Promise<void>
}

function NoteRow({ doc, onDelete, onEdit }: { doc: DocWithAuthor; onDelete: (id: string) => void; onEdit: (id: string, title: string, content: string) => Promise<void> }) {
  const t = useTranslations("admin.clients.sessionNotes")
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(doc.title)
  const [editContent, setEditContent] = useState(doc.content ?? "")
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState("")

  const typeLabel = t(DOC_TYPE_I18N_KEYS[doc.type] ?? "typeSessionNote")
  const isLong = (doc.content?.length ?? 0) > 120 || (doc.content?.split("\n").length ?? 0) > 2

  async function handleSave() {
    if (!editContent.trim()) return
    setSaving(true)
    setEditError("")
    try {
      await onEdit(doc.id, editTitle.trim(), editContent.trim())
      setEditing(false)
    } catch {
      setEditError(t("error"))
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    setEditTitle(doc.title)
    setEditContent(doc.content ?? "")
    setEditError("")
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="py-3 flex flex-col gap-2">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={FIELD_MAX_TITLE}
          className="text-sm"
        />
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={4}
          required
          autoFocus
        />
        {editError && <p className="text-xs text-red-600">{editError}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !editContent.trim()}
            className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            {saving ? t("saving") : t("save")}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={saving}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            {t("cancel")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-3 group">
      <div className="flex items-start justify-between gap-2">
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => isLong && setExpanded((v) => !v)}
          style={{ cursor: isLong ? "pointer" : "default" }}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${DOC_TYPE_BADGE_CLASSES[doc.type] ?? DOC_TYPE_BADGE_CLASSES.session_note}`}>
              {typeLabel}
            </span>
            <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
            {doc.author?.name && <span className="text-xs text-slate-400">· {doc.author.name}</span>}
            {doc.updatedAt > doc.createdAt && (
              <span className="text-xs text-slate-300 italic">{t("edited")}</span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-800">{doc.title}</p>
          <p className={`text-sm text-slate-600 mt-0.5 leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-2"}`}>
            {doc.content}
          </p>
          {isLong && (
            <span className="flex items-center gap-0.5 text-xs text-teal-600 mt-1">
              {expanded
                ? <><ChevronUp className="w-3 h-3" /> {t("showLess")}</>
                : <><ChevronDown className="w-3 h-3" /> {t("showMore")}</>
              }
            </span>
          )}
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-slate-300 hover:text-teal-500 transition-colors rounded"
            title={t("edit")}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded"
            title={t("delete")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function SessionNotesList({ docs, deleteError, onDelete, onEdit }: Props) {
  const t = useTranslations("admin.clients.sessionNotes")

  return (
    <>
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
      {docs.length === 0 ? (
        <p className="text-sm text-slate-400">{t("noNotes")}</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {docs.map((doc) => (
            <NoteRow key={doc.id} doc={doc} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}
    </>
  )
}
