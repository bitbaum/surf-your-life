"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"

interface Program {
  id: string
  title: string
  durationWeeks: number | null
}

interface EnrollProgramButtonProps {
  clientId: string
  programs: Program[]
}

export function EnrollProgramButton({ clientId, programs }: EnrollProgramButtonProps) {
  const t = useTranslations("admin.programs")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [programId, setProgramId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!programId) return
    setSaving(true)
    setError("")

    const res = await fetch(`/api/admin/programs/${programId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        startDate: startDate || null,
        notes: notes.trim() || undefined,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!data.success) {
      setError(data.error ?? t("saveError"))
      return
    }

    setOpen(false)
    setProgramId("")
    setStartDate("")
    setNotes("")
    router.refresh()
  }

  if (programs.length === 0) return null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        {t("enroll")}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">{t("enrollTitle")}</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={t("cancel")}
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleEnroll} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="programId" className="text-sm font-medium text-slate-700">
                  {t("fieldSelectProgram")} *
                </label>
                <select
                  id="programId"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 min-h-[44px]"
                >
                  <option value="">{t("fieldSelectProgramPlaceholder")}</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}{p.durationWeeks ? ` (${p.durationWeeks}w)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
                  {t("fieldStartDate")}
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                  {t("fieldNotes")}
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("fieldNotesPlaceholder")}
                  rows={3}
                  maxLength={2000}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={saving || !programId}>
                  {saving ? t("saving") : t("enrollConfirm")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
