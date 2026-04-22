"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { Technique } from "@/lib/db/schema"
import { X } from "lucide-react"
import { TechniqueFormFields } from "./technique-form-fields"

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
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
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
          <TechniqueFormFields field={field} />
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
