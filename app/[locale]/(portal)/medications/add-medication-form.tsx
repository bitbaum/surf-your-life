"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { FIELD_MAX_TITLE, FIELD_MAX_SHORT, FIELD_MAX_NOTES } from "@/lib/constants"

interface Props {
  onSaved: () => void
  onCancel: () => void
}

export function AddMedicationForm({ onSaved, onCancel }: Props) {
  const t = useTranslations("portal.medications")
  const [form, setForm] = useState({ medicationName: "", dose: "", frequency: "", startDate: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.medicationName.trim()) return
    setSaving(true)
    setError("")

    const res = await fetch("/api/medication-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationName: form.medicationName.trim(),
        dose: form.dose.trim() || undefined,
        frequency: form.frequency.trim() || undefined,
        startDate: form.startDate || undefined,
        notes: form.notes.trim() || undefined,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!data.success) {
      setError(t("saveError"))
      return
    }

    toast.success(t("addedSuccess"))
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 border border-slate-200 rounded-xl flex flex-col gap-3 bg-slate-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldName")} *</label>
          <Input value={form.medicationName} onChange={(e) => setForm((f) => ({ ...f, medicationName: e.target.value }))} placeholder={t("fieldNamePlaceholder")} required maxLength={FIELD_MAX_TITLE} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldDose")}</label>
          <Input value={form.dose} onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} placeholder={t("fieldDosePlaceholder")} maxLength={FIELD_MAX_SHORT} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldFrequency")}</label>
          <Input value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))} placeholder={t("fieldFrequencyPlaceholder")} maxLength={FIELD_MAX_SHORT} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldStartDate")}</label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldNotes")}</label>
        <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={t("fieldNotesPlaceholder")} maxLength={FIELD_MAX_NOTES} />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving} size="sm">{saving ? t("saving") : t("save")}</Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>{t("cancel")}</Button>
      </div>
    </form>
  )
}
