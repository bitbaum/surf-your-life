"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { SERVICE_CATEGORIES, type ServiceInput } from "@/lib/domain/services"
import { SERVICE_DURATION_MINUTES } from "@/lib/constants"

export function CreateServiceForm() {
  const t = useTranslations("admin.services")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "consultation" as ServiceInput["category"],
    durationMinutes: "",
  })

  async function handleSubmit() {
    if (!form.name.trim()) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          category: form.category,
          durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t("error"))
        return
      }
      setForm({ name: "", description: "", category: "consultation", durationMinutes: "" })
      setOpen(false)
      router.refresh()
    } catch {
      setError(t("error"))
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        {t("newService")}
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
      <p className="text-sm font-medium text-teal-800 mb-3">{t("newServiceTitle")}</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldNameRequired")}</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("namePlaceholder")}
            autoFocus
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldDuration")}</label>
          <input
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            placeholder="60"
            min={SERVICE_DURATION_MINUTES.min}
            max={SERVICE_DURATION_MINUTES.max}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldCategoryRequired")}</label>
          <Select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))}
          >
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`categoryLabels.${c}`)}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldDescription")}</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder={t("fieldDescriptionPlaceholder")}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-red-500 flex-1">{error}</span>}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">
            {t("cancel")}
          </button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? t("creating") : t("createService")}
          </Button>
        </div>
      </div>
    </div>
  )
}
