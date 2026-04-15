"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Plus, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Technique, TechniqueAssignment } from "@/lib/db/schema"
import { formatEnumValue } from "@/lib/utils"
import { TECHNIQUE_CATEGORIES } from "@/lib/constants"

type AssignmentWithTechnique = TechniqueAssignment & { technique: Technique }

interface TechniqueAssignmentsProps {
  clientId: string
  assignments: AssignmentWithTechnique[]
  allTechniques: Technique[]
}

export function TechniqueAssignments({ clientId, assignments, allTechniques }: TechniqueAssignmentsProps) {
  const t = useTranslations("admin.techniques")
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    techniqueId: "",
    frequencyPerDay: "1",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  const assigned = new Set(assignments.map((a) => a.techniqueId))
  const available = allTechniques.filter((t) => !assigned.has(t.id))

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!form.techniqueId) return
    setSaving(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const res = await fetch("/api/technique-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techniqueId: form.techniqueId,
          clientId,
          frequencyPerDay: parseInt(form.frequencyPerDay),
          notes: form.notes || undefined,
          startDate: today,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("assignedSuccess"))
      setAdding(false)
      setForm({ techniqueId: "", frequencyPerDay: "1", notes: "" })
      router.refresh()
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(assignmentId: string) {
    if (!confirm(t("removeConfirm"))) return
    const res = await fetch(`/api/technique-assignments/${assignmentId}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(t("removedSuccess"))
      router.refresh()
    } else {
      toast.error(t("saveError"))
    }
  }

  const categoryEmoji = Object.fromEntries(TECHNIQUE_CATEGORIES.map(({ value, emoji }) => [value, emoji]))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            {t("assignedTitle")}
            <span className="text-sm font-normal text-slate-400">({assignments.length})</span>
          </CardTitle>
          {available.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t("assign")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {adding && (
          <form onSubmit={handleAssign} className="mb-4 p-3 bg-slate-50 rounded-lg flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("fieldSelectTechnique")}</label>
              <select
                required
                value={form.techniqueId}
                onChange={(e) => setForm((f) => ({ ...f, techniqueId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{t("selectPlaceholder")}</option>
                {available.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {categoryEmoji[tech.category]} {tech.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("fieldFrequency")}</label>
              <input
                type="number"
                min={1}
                max={10}
                value={form.frequencyPerDay}
                onChange={(e) => setForm((f) => ({ ...f, frequencyPerDay: e.target.value }))}
                className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="ml-2 text-xs text-slate-400">{t("perDay")}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{t("fieldNotes")}</label>
              <input
                type="text"
                maxLength={200}
                placeholder={t("notesPlaceholder")}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>{t("cancel")}</Button>
              <Button type="submit" size="sm" disabled={saving || !form.techniqueId}>
                {saving ? t("saving") : t("assign")}
              </Button>
            </div>
          </form>
        )}

        {assignments.length === 0 ? (
          <p className="text-slate-400 text-sm">{t("noAssignments")}</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {assignments.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">{a.technique.name}</span>
                    <span className="text-xs text-slate-400">
                      {categoryEmoji[a.technique.category]} {formatEnumValue(a.technique.category)}
                    </span>
                    <span className="text-xs text-teal-600 font-medium">
                      {a.frequencyPerDay}× {t("perDay")}
                    </span>
                  </div>
                  {a.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{a.notes}</p>}
                </div>
                <button
                  onClick={() => handleRemove(a.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title={t("remove")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
