"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Plus, Square, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AddMedicationForm } from "./add-medication-form"
import { MedicationHistoricalList } from "./medication-historical-list"

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

  const today = new Date().toISOString().slice(0, 10)
  const current = meds.filter((m) => !m.endDate || m.endDate > today)
  const historical = meds.filter((m) => m.endDate && m.endDate <= today)

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
          <AddMedicationForm
            onSaved={() => { setShowForm(false); router.refresh() }}
            onCancel={() => setShowForm(false)}
          />
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

      <MedicationHistoricalList medications={historical} deleting={deleting} onDelete={handleDelete} />
    </div>
  )
}
