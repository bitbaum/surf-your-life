"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { TECHNIQUE_CATEGORIES, TECHNIQUE_DIFFICULTIES } from "@/lib/constants"
import type { Technique } from "@/lib/db/schema"
import { X } from "lucide-react"

interface TechniqueFormProps {
  technique?: Technique
  onClose: () => void
  onSaved: () => void
}

export function TechniqueForm({ technique, onClose, onSaved }: TechniqueFormProps) {
  const t = useTranslations("admin.techniques")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: technique?.name ?? "",
    description: technique?.description ?? "",
    category: technique?.category ?? "breathwork",
    instructions: technique?.instructions ?? "",
    durationMinutes: technique?.durationMinutes?.toString() ?? "",
    difficulty: technique?.difficulty ?? "easy",
    resourceUrl: technique?.resourceUrl ?? "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
        resourceUrl: form.resourceUrl || undefined,
      }
      const url = technique ? `/api/techniques/${technique.id}` : "/api/techniques"
      const method = technique ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(technique ? t("savedSuccess") : t("createdSuccess"))
      onSaved()
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {technique ? t("editTitle") : t("createTitle")}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldName")} *</label>
            <input
              {...field("name")}
              required
              maxLength={120}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldCategory")} *</label>
              <select
                {...field("category")}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {TECHNIQUE_CATEGORIES.map(({ value, emoji }) => (
                  <option key={value} value={value}>{emoji} {t(`category.${value}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldDifficulty")} *</label>
              <select
                {...field("difficulty")}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {TECHNIQUE_DIFFICULTIES.map(({ value }) => (
                  <option key={value} value={value}>{t(`difficulty.${value}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldDescription")}</label>
            <textarea
              {...field("description")}
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldInstructions")}</label>
            <textarea
              {...field("instructions")}
              rows={4}
              maxLength={2000}
              placeholder={t("instructionsPlaceholder")}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldDuration")}</label>
              <input
                type="number"
                min={1}
                max={120}
                placeholder="10"
                {...field("durationMinutes")}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t("fieldResourceUrl")}</label>
              <input
                type="url"
                {...field("resourceUrl")}
                placeholder="https://"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={onClose}>{t("cancel")}</Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
