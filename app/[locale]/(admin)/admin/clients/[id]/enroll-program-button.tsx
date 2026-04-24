"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { FIELD_MAX_LONG } from "@/lib/constants"

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

    try {
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
      if (!data.success) {
        setError(data.error ?? t("saveError"))
        return
      }
      setOpen(false)
      setProgramId("")
      setStartDate("")
      setNotes("")
      router.refresh()
    } catch {
      setError(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  if (programs.length === 0) return null

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        {t("enroll")}
      </Button>

      {open && (
        <Modal title={t("enrollTitle")} onClose={() => setOpen(false)} closeLabel={t("cancel")}>
          <form onSubmit={handleEnroll} className="flex flex-col gap-4">
            <Select
              id="programId"
              label={`${t("fieldSelectProgram")} *`}
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              required
            >
              <option value="">{t("fieldSelectProgramPlaceholder")}</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{p.durationWeeks ? ` (${p.durationWeeks}w)` : ""}
                </option>
              ))}
            </Select>

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

            <Textarea
              id="notes"
              label={t("fieldNotes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fieldNotesPlaceholder")}
              rows={3}
              maxLength={FIELD_MAX_LONG}
            />

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
        </Modal>
      )}
    </>
  )
}
