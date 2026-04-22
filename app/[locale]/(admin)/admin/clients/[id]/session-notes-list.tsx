"use client"

import { useTranslations } from "next-intl"
import { Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Document } from "@/lib/db/schema"
import { DOC_TYPE_I18N_KEYS, DOC_TYPE_BADGE_CLASSES } from "@/lib/constants"

type DocWithAuthor = Document & { author: { name: string | null } | null }

interface Props {
  docs: DocWithAuthor[]
  deleteError: string
  onDelete: (id: string) => void
}

export function SessionNotesList({ docs, deleteError, onDelete }: Props) {
  const t = useTranslations("admin.clients.sessionNotes")
  const typeLabel = (docType: string) => t(DOC_TYPE_I18N_KEYS[docType] ?? "typeSessionNote")

  return (
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
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${DOC_TYPE_BADGE_CLASSES[doc.type] ?? DOC_TYPE_BADGE_CLASSES.session_note}`}>
                      {typeLabel(doc.type)}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                    {doc.author?.name && <span className="text-xs text-slate-400">· {doc.author.name}</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{doc.content}</p>
                </div>
                <button onClick={() => onDelete(doc.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" title={t("delete")}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
