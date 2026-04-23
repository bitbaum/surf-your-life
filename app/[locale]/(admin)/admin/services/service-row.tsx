"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import type { InferSelectModel } from "drizzle-orm"
import type { services } from "@/lib/db/schema"
import { ServiceEditRow } from "./service-edit-row"

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
    try {
      const res = await fetch(`/api/admin/services/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (res.ok) setData(json.data)
      return res.ok
    } catch {
      return false
    } finally {
      setSaving(false)
    }
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
      <ServiceEditRow
        form={form}
        saving={saving}
        onChange={setForm}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
      />
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
