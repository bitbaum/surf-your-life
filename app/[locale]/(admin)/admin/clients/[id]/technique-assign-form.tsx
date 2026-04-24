"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import type { Technique } from "@/lib/db/schema"
import { toDateString } from "@/lib/utils"
import { FIELD_MAX_TITLE, TECHNIQUE_DAILY_FREQUENCY_MAX } from "@/lib/constants"

interface Props {
  clientId: string
  available: Technique[]
  categoryEmoji: Record<string, string>
  onSaved: () => void
  onCancel: () => void
}

export function TechniqueAssignForm({ clientId, available, categoryEmoji, onSaved, onCancel }: Props) {
  const t = useTranslations("admin.techniques")
  const router = useRouter()
  const [form, setForm] = useState({ techniqueId: "", frequencyPerDay: "1", notes: "" })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.techniqueId) return
    setSaving(true)
    try {
      const res = await fetch("/api/technique-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techniqueId: form.techniqueId,
          clientId,
          frequencyPerDay: parseInt(form.frequencyPerDay),
          notes: form.notes || undefined,
          startDate: toDateString(new Date()),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(t("assignedSuccess"))
      router.refresh()
      onSaved()
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-3 bg-slate-50 rounded-lg flex flex-col gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t("fieldSelectTechnique")}</label>
        <Select
          required
          value={form.techniqueId}
          onChange={(e) => setForm((f) => ({ ...f, techniqueId: e.target.value }))}
        >
          <option value="">{t("selectPlaceholder")}</option>
          {available.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {categoryEmoji[tech.category]} {tech.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">{t("fieldFrequency")}</label>
        <input
          type="number"
          min={1}
          max={TECHNIQUE_DAILY_FREQUENCY_MAX}
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
          maxLength={FIELD_MAX_TITLE}
          placeholder={t("notesPlaceholder")}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>{t("cancel")}</Button>
        <Button type="submit" size="sm" disabled={saving || !form.techniqueId}>
          {saving ? t("saving") : t("assign")}
        </Button>
      </div>
    </form>
  )
}
