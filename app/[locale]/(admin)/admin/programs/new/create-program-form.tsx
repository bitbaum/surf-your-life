"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MAIN_CONCERNS } from "@/lib/constants"
import { formatEnumValue } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

type Phase = { week: number; title: string; guidance: string }

export function CreateProgramForm() {
  const t = useTranslations("admin.programs")
  const router = useRouter()

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationWeeks: "",
    targetConcern: "",
    isTemplate: false,
  })
  const [phases, setPhases] = useState<Phase[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addPhase() {
    const nextWeek = phases.length > 0 ? Math.max(...phases.map((p) => p.week)) + 1 : 1
    setPhases((prev) => [...prev, { week: nextWeek, title: "", guidance: "" }])
  }

  function updatePhase(index: number, field: keyof Phase, value: string | number) {
    setPhases((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function removePhase(index: number) {
    setPhases((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const res = await fetch("/api/admin/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        durationWeeks: form.durationWeeks ? parseInt(form.durationWeeks) : null,
        targetConcern: form.targetConcern || null,
        isTemplate: form.isTemplate,
        phaseConfig: phases.length > 0 ? phases : null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!data.success) {
      setError(data.error ?? t("saveError"))
      return
    }

    router.push(`/admin/programs/${data.data.id}`)
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("newTitle")}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium text-slate-700">{t("fieldTitle")} *</label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={t("fieldTitlePlaceholder")}
              required
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">{t("fieldDescription")}</label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t("fieldDescriptionPlaceholder")}
              maxLength={2000}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="durationWeeks" className="text-sm font-medium text-slate-700">{t("fieldDuration")}</label>
              <Input
                id="durationWeeks"
                type="number"
                min={1}
                max={104}
                value={form.durationWeeks}
                onChange={(e) => set("durationWeeks", e.target.value)}
                placeholder={t("fieldDurationPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="targetConcern" className="text-sm font-medium text-slate-700">{t("fieldTargetConcern")}</label>
              <select
                id="targetConcern"
                value={form.targetConcern}
                onChange={(e) => set("targetConcern", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 min-h-[44px]"
              >
                <option value="">{t("fieldTargetConcernAny")}</option>
                {MAIN_CONCERNS.map((c) => (
                  <option key={c} value={c}>{formatEnumValue(c)}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isTemplate}
              onChange={(e) => set("isTemplate", e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <span className="text-sm text-slate-700">{t("fieldIsTemplate")}</span>
          </label>

          {/* Phase config editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">{t("fieldPhases")}</label>
              <button
                type="button"
                onClick={addPhase}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("addPhase")}
              </button>
            </div>
            {phases.length === 0 && (
              <p className="text-xs text-slate-400">{t("noPhasesHint")}</p>
            )}
            <div className="flex flex-col gap-4">
              {phases.map((phase, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 w-20">
                      <label className="text-xs text-slate-500">{t("phaseWeek")}</label>
                      <Input
                        type="number"
                        min={1}
                        max={104}
                        value={phase.week}
                        onChange={(e) => updatePhase(i, "week", parseInt(e.target.value) || 1)}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-xs text-slate-500">{t("phaseTitle")}</label>
                      <Input
                        value={phase.title}
                        onChange={(e) => updatePhase(i, "title", e.target.value)}
                        placeholder={t("phaseTitlePlaceholder")}
                        maxLength={200}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhase(i)}
                      className="text-slate-400 hover:text-red-500 mt-4 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">{t("phaseGuidance")}</label>
                    <textarea
                      value={phase.guidance}
                      onChange={(e) => updatePhase(i, "guidance", e.target.value)}
                      placeholder={t("phaseGuidancePlaceholder")}
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? t("saving") : t("save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/programs")}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
