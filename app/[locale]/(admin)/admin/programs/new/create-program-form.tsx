"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgramBasicFields } from "../[id]/program-basic-fields"
import { ProgramProgramPhaseEditor } from "../[id]/program-phase-editor"
import type { ProgramPhase } from "@/lib/domain/program"

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
  const [phases, setProgramPhases] = useState<ProgramPhase[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addProgramPhase() {
    const nextWeek = phases.length > 0 ? Math.max(...phases.map((p) => p.week)) + 1 : 1
    setProgramPhases((prev) => [...prev, { week: nextWeek, title: "", guidance: "" }])
  }

  function updateProgramPhase(index: number, field: keyof ProgramPhase, value: string | number) {
    setProgramPhases((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  function removeProgramPhase(index: number) {
    setProgramPhases((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
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
      if (!data.success) {
        setError(data.error ?? t("saveError"))
        return
      }
      router.push(`/admin/programs/${data.data.id}`)
    } catch {
      setError(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t("newTitle")}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <ProgramBasicFields form={form} onChange={set} />
          <ProgramProgramPhaseEditor phases={phases} onAdd={addProgramPhase} onUpdate={updateProgramPhase} onRemove={removeProgramPhase} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin/programs")}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
