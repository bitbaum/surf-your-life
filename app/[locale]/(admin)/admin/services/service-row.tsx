"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { SERVICE_CATEGORIES } from "@/lib/domain/services"
import type { InferSelectModel } from "drizzle-orm"
import type { services } from "@/lib/db/schema"

type Service = InferSelectModel<typeof services>

interface Props {
  service: Service
}

export function ServiceRow({ service }: Props) {
  const t = useTranslations("admin.services")
  const [data, setData] = useState(service)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: service.name,
    description: service.description ?? "",
    category: service.category,
    durationMinutes: service.durationMinutes?.toString() ?? "",
  })

  async function patch(body: Record<string, unknown>) {
    setSaving(true)
    const res = await fetch(`/api/admin/services/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (res.ok) setData(json.data)
    setSaving(false)
    return res.ok
  }

  async function handleToggle() {
    await patch({ available: !data.available })
  }

  async function handleSave() {
    const ok = await patch({
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null,
    })
    if (ok) setEditing(false)
  }

  if (editing) {
    return (
      <tr className="border-b border-slate-50 bg-slate-50">
        <td className="py-3 pr-3" colSpan={5}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldName")}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldDuration")}</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  min={5}
                  max={480}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldCategory")}</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof service.category }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(`categoryLabels.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldDescription")}</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                {t("cancel")}
              </button>
              <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className="py-3">
        <p className="font-medium text-slate-800">{data.name}</p>
        {data.description && <p className="text-xs text-slate-400 mt-0.5">{data.description}</p>}
      </td>
      <td className="py-3 text-sm text-slate-600">{t(`categoryLabels.${data.category}`)}</td>
      <td className="py-3 text-sm text-slate-500">
        {data.durationMinutes ? `${data.durationMinutes} min` : "—"}
      </td>
      <td className="py-3">
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
            data.available
              ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
              : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
          }`}
        >
          {data.available ? t("available") : t("hidden")}
        </button>
      </td>
      <td className="py-3 text-right">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-teal-600 hover:underline font-medium"
        >
          {t("edit")}
        </button>
      </td>
    </tr>
  )
}
