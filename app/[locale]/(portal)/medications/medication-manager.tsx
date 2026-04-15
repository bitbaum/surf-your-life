"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Square, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"

type Medication = {
  id: string
  medicationName: string
  dose: string | null
  frequency: string | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  createdAt: Date
}

type Props = {
  medications: Medication[]
}

export function MedicationManager({ medications: initial }: Props) {
  const t = useTranslations("portal.medications")
  const router = useRouter()
  const [meds, setMeds] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [stopping, setStopping] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showHistorical, setShowHistorical] = useState(false)

  // Form state
  const [form, setForm] = useState({
    medicationName: "",
    dose: "",
    frequency: "",
    startDate: "",
    notes: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const today = new Date().toISOString().slice(0, 10)
  const current = meds.filter((m) => !m.endDate || m.endDate > today)
  const historical = meds.filter((m) => m.endDate && m.endDate <= today)

  async function handleAdd(e: React.FormEvent) {
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

    router.refresh()
    setForm({ medicationName: "", dose: "", frequency: "", startDate: "", notes: "" })
    setShowForm(false)
    toast.success(t("addedSuccess"))
  }

  async function handleStop(id: string) {
    setStopping(id)
    try {
      const res = await fetch(`/api/medication-log/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endDate: today }),
      })
      if (!res.ok) throw new Error()
      setMeds((prev) => prev.map((m) => m.id === id ? { ...m, endDate: today } : m))
      toast.success(t("stoppedSuccess"))
    } catch {
      toast.error(t("saveError"))
    } finally {
      setStopping(null)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/medication-log/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setMeds((prev) => prev.filter((m) => m.id !== id))
      toast.success(t("deletedSuccess"))
    } catch {
      toast.error(t("saveError"))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Current medications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">{t("current")} ({current.length})</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("add")}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 border border-slate-200 rounded-xl flex flex-col gap-3 bg-slate-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldName")} *</label>
                <Input
                  value={form.medicationName}
                  onChange={(e) => setForm((f) => ({ ...f, medicationName: e.target.value }))}
                  placeholder={t("fieldNamePlaceholder")}
                  required
                  maxLength={200}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldDose")}</label>
                <Input
                  value={form.dose}
                  onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))}
                  placeholder={t("fieldDosePlaceholder")}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldFrequency")}</label>
                <Input
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                  placeholder={t("fieldFrequencyPlaceholder")}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldStartDate")}</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t("fieldNotes")}</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder={t("fieldNotesPlaceholder")}
                maxLength={500}
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} size="sm">
                {saving ? t("saving") : t("save")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        )}

        {current.length === 0 && !showForm && (
          <p className="text-sm text-slate-400">{t("empty")}</p>
        )}

        <div className="flex flex-col gap-2">
          {current.map((med) => (
            <div key={med.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{med.medicationName}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {med.dose && <span className="text-xs text-slate-500">{med.dose}</span>}
                  {med.frequency && <span className="text-xs text-slate-500">{med.frequency}</span>}
                  {med.startDate && <span className="text-xs text-slate-400">{t("since")} {med.startDate}</span>}
                </div>
                {med.notes && <p className="text-xs text-slate-400 mt-1">{med.notes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleStop(med.id)}
                  disabled={stopping === med.id}
                  title={t("stop")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40 transition-colors"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(med.id)}
                  disabled={deleting === med.id}
                  title={t("delete")}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical medications */}
      {historical.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistorical(!showHistorical)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showHistorical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {t("past")} ({historical.length})
          </button>

          {showHistorical && (
            <div className="flex flex-col gap-2 mt-3">
              {historical.map((med) => (
                <div key={med.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 opacity-60">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{med.medicationName}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                      {med.dose && <span className="text-xs text-slate-500">{med.dose}</span>}
                      {med.startDate && <span className="text-xs text-slate-400">{med.startDate} → {med.endDate}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(med.id)}
                    disabled={deleting === med.id}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
