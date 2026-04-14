"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { PRACTITIONER_NOTE_MAX_LENGTH } from "@/lib/constants"
import { formatDate } from "@/lib/utils"

interface Props {
  checkInId: string
  existingNote: string | null
  existingNoteAt: Date | null
}

export function CheckInNote({ checkInId, existingNote, existingNoteAt }: Props) {
  const t = useTranslations("admin.clients.checkInNote")
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(existingNote ?? "")
  const [saved, setSaved] = useState(existingNote ?? "")
  const [savedAt, setSavedAt] = useState(existingNoteAt)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    setError("")
    const res = await fetch(`/api/check-in/${checkInId}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: text.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? t("saving"))
      setSaving(false)
      return
    }
    setSaved(text.trim())
    setSavedAt(new Date())
    setOpen(false)
    setSaving(false)
  }

  return (
    <div className="mt-2">
      {saved && !open ? (
        <div className="bg-teal-50 border-l-2 border-teal-400 rounded-r-lg px-3 py-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-teal-700 mb-0.5">
              {t("yourNote")} {savedAt ? `· ${formatDate(savedAt)}` : ""}
            </p>
            <p className="text-sm text-teal-900 leading-relaxed">{saved}</p>
          </div>
          <button
            onClick={() => { setText(saved); setOpen(true) }}
            className="text-xs text-teal-600 hover:text-teal-800 flex-shrink-0 mt-0.5"
          >
            {t("edit")}
          </button>
        </div>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-slate-400 hover:text-teal-600 transition-colors"
        >
          {t("addNote")}
        </button>
      ) : null}

      {open && (
        <div className="mt-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={PRACTITIONER_NOTE_MAX_LENGTH}
            rows={3}
            placeholder={t("placeholder")}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-slate-300"
            autoFocus
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-slate-400">{text.length}/{PRACTITIONER_NOTE_MAX_LENGTH}</span>
            <div className="flex gap-2">
              {error && <span className="text-xs text-red-500">{error}</span>}
              <button
                onClick={() => { setOpen(false); setText(saved) }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {t("cancel")}
              </button>
              <Button size="sm" onClick={handleSave} disabled={saving || !text.trim()}>
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
