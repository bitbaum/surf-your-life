"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MAIN_CONCERNS } from "@/lib/constants"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { Plus, Trash2, Pencil, Clock, Calendar } from "lucide-react"
import type { Program } from "@/lib/db/schema"

type Phase = { week: number; title: string; guidance: string }

interface Props {
  program: Program
}

export function EditProgramForm({ program }: Props) {
  const t = useTranslations("admin.programs")
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const initialPhases = Array.isArray(program.phaseConfig)
    ? (program.phaseConfig as Phase[]).sort((a, b) => a.week - b.week)
    : []

  const [form, setForm] = useState({
    title: program.title,
    description: program.description ?? "",
    durationWeeks: program.durationWeeks ? String(program.durationWeeks) : "",
    targetConcern: program.targetConcern ?? "",
    isTemplate: program.isTemplate,
  })
  const [phases, setPhases] = useState<Phase[]>(initialPhases)

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addPhase() {
    const nextWeek = phases.length > 0 ? Math.max(...phases.map((p) => p.week)) + 1 : 1
    setPhases((prev) => [...prev, { week: nextWeek, title: "", guidance: "" }])
  }

  function updatePhase(index: number, field: keyof Phase, value: string | number) {
    setPhases((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  function removePhase(index: number) {
    setPhases((prev) => prev.filter((_, i) => i !== index))
  }

  function handleCancel() {
    setForm({
      title: program.title,
      description: program.description ?? "",
      durationWeeks: program.durationWeeks ? String(program.durationWeeks) : "",
      targetConcern: program.targetConcern ?? "",
      isTemplate: program.isTemplate,
    })
    setPhases(initialPhases)
    setError("")
    setEditing(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const res = await fetch(`/api/admin/programs/${program.id}`, {
      method: "PATCH",
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

    setEditing(false)
    router.refresh()
  }

  // ─── View mode ───────────────────────────────────────────────────────────────

  if (!editing) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{program.title}</CardTitle>
              {program.description && (
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">{program.description}</p>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors flex-shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("edit")}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {program.durationWeeks && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {program.durationWeeks} {t("weeks")}
              </span>
            )}
            {program.targetConcern && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                {formatEnumValue(program.targetConcern)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {t("createdOn", { date: formatDate(program.createdAt) })}
            </span>
          </div>

          {initialPhases.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {t("fieldPhases")} ({initialPhases.length})
              </p>
              <div className="flex flex-col gap-2">
                {initialPhases.map((phase, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 w-14 text-xs font-medium text-slate-400 pt-0.5">
                      {t("phaseWeek")} {phase.week}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">{phase.title}</p>
                      {phase.guidance && (
                        <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{phase.guidance}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ─── Edit mode ────────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-title" className="text-sm font-medium text-slate-700">{t("fieldTitle")} *</label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-description" className="text-sm font-medium text-slate-700">{t("fieldDescription")}</label>
            <textarea
              id="edit-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-duration" className="text-sm font-medium text-slate-700">{t("fieldDuration")}</label>
              <Input
                id="edit-duration"
                type="number"
                min={1}
                max={104}
                value={form.durationWeeks}
                onChange={(e) => set("durationWeeks", e.target.value)}
                placeholder={t("fieldDurationPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-concern" className="text-sm font-medium text-slate-700">{t("fieldTargetConcern")}</label>
              <select
                id="edit-concern"
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

          {/* Phase editor */}
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
              {saving ? t("editSaving") : t("editSave")}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
