"use client"

import { useTranslations } from "next-intl"
import type { Document } from "@/lib/db/schema"
import { NoteRow } from "./session-note-row"

export type DocWithAuthor = Document & { author: { name: string | null } | null }

interface Props {
  docs: DocWithAuthor[]
  deleteError: string
  onDelete: (id: string) => void
  onEdit: (id: string, title: string, content: string) => Promise<void>
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
