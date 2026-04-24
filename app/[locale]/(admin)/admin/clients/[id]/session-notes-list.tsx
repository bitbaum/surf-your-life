"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Document } from "@/lib/db/schema"
import { DOC_TYPE_I18N_KEYS, DOC_TYPE_BADGE_CLASSES } from "@/lib/constants"

export type DocWithAuthor = Document & { author: { name: string | null } | null }

interface Props {
  docs: DocWithAuthor[]
  deleteError: string
  onDelete: (id: string) => void
}

function NoteRow({ doc, onDelete }: { doc: DocWithAuthor; onDelete: (id: string) => void }) {
  const t = useTranslations("admin.clients.sessionNotes")
  const [expanded, setExpanded] = useState(false)
  const typeLabel = t(DOC_TYPE_I18N_KEYS[doc.type] ?? "typeSessionNote")

  // Only show expand toggle when content is long enough to be clipped
  const isLong = (doc.content?.length ?? 0) > 120 || (doc.content?.split("\n").length ?? 0) > 2

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
        <button
          onClick={() => onDelete(doc.id)}
          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          title={t("delete")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function SessionNotesList({ docs, deleteError, onDelete }: Props) {
  const t = useTranslations("admin.clients.sessionNotes")

  return (
    <>
      {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
      {docs.length === 0 ? (
        <p className="text-sm text-slate-400">{t("noNotes")}</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {docs.map((doc) => (
            <NoteRow key={doc.id} doc={doc} onDelete={onDelete} />
          ))}
        </div>
      )}
    </>
  )
}
