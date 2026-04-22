"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { CAPACITY_SCALE } from "@/lib/constants"

const DIMENSIONS = [
  { key: "overallCapacity", required: true },
  { key: "physicalCapacity", required: false },
  { key: "cognitiveCapacity", required: false },
  { key: "emotionalCapacity", required: false },
  { key: "socialCapacity", required: false },
] as const

export function NewAssessmentForm({ onDone }: { onDone: () => void }) {
  const t = useTranslations("portal.assessments")
  const router = useRouter()

  const [values, setValues] = useState<Record<string, number>>({
    overallCapacity: CAPACITY_SCALE.default,
    physicalCapacity: CAPACITY_SCALE.default,
    cognitiveCapacity: CAPACITY_SCALE.default,
    emotionalCapacity: CAPACITY_SCALE.default,
    socialCapacity: CAPACITY_SCALE.default,
  })
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["overallCapacity"]))

  function toggle(key: string) {
    if (key === "overallCapacity") return // always required
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    const body: Record<string, unknown> = { notes: notes.trim() || undefined }
    for (const { key } of DIMENSIONS) {
      if (enabled.has(key)) body[key] = values[key]
    }

    const res = await fetch("/api/functional-assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    setSaving(false)

    if (!data.success) {
      setError(t("saveError"))
      return
    }

    router.refresh()
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <p className="text-xs text-slate-400">{t("formHint")}</p>

      {DIMENSIONS.map(({ key, required }) => {
        const active = enabled.has(key)
        return (
          <div key={key} className={active ? "" : "opacity-40"}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">{t(key as Parameters<typeof t>[0])}</label>
                {!required && (
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      active
                        ? "border-teal-400 text-teal-600 bg-teal-50"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    {active ? t("tracked") : t("notTracked")}
                  </button>
                )}
              </div>
              <span className="text-sm font-bold text-teal-700 w-8 text-right">
                {active ? values[key] : "—"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 w-4">{CAPACITY_SCALE.min}</span>
              <input
                type="range"
                min={CAPACITY_SCALE.min}
                max={CAPACITY_SCALE.max}
                value={values[key]}
                disabled={!active}
                onChange={(e) => setValues((v) => ({ ...v, [key]: parseInt(e.target.value) }))}
                className="flex-1 accent-teal-600 disabled:cursor-not-allowed"
              />
              <span className="text-xs text-slate-400 w-4">{CAPACITY_SCALE.max}</span>
            </div>
          </div>
        )
      })}

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1.5">
          {t("notes")} <span className="text-slate-400 font-normal">{t("optional")}</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("notesPlaceholder")}
          maxLength={2000}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  )
}
