"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SERVICE_CATEGORIES } from "@/lib/domain/services"

const CATEGORY_LABELS: Record<string, string> = {
  machine: "Machine",
  space: "Space",
  consultation: "Consultation",
}

export function CreateServiceForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "consultation" as "machine" | "space" | "consultation",
    durationMinutes: "",
  })

  async function handleSubmit() {
    if (!form.name.trim()) return
    setSaving(true)
    setError("")
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
      setError(data.error ?? "Failed to create")
      setSaving(false)
      return
    }
    setForm({ name: "", description: "", category: "consultation", durationMinutes: "" })
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        + New service
      </Button>
    )
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
      <p className="text-sm font-medium text-teal-800 mb-3">New service</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Initial consultation"
            autoFocus
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Duration (min)</label>
          <input
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            placeholder="60"
            min={5}
            max={480}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Category *</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {SERVICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-red-500 flex-1">{error}</span>}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
          <Button size="sm" onClick={handleSubmit} disabled={saving || !form.name.trim()}>
            {saving ? "Creating…" : "Create service"}
          </Button>
        </div>
      </div>
    </div>
  )
}
