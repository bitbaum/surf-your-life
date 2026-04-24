"use client"

import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"
import { FIELD_MAX_TITLE, FIELD_MAX_LONG, PROGRAM_DURATION_WEEKS_MAX } from "@/lib/constants"
import type { ProgramPhase } from "@/lib/domain/program"

interface Props {
  phases: ProgramPhase[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof ProgramPhase, value: string | number) => void
  onRemove: (index: number) => void
}

export function ProgramProgramPhaseEditor({ phases, onAdd, onUpdate, onRemove }: Props) {
  const t = useTranslations("admin.programs")

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-700">{t("fieldProgramPhases")}</label>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("addProgramPhase")}
        </button>
      </div>
      {phases.length === 0 && (
        <p className="text-xs text-slate-400">{t("noProgramPhasesHint")}</p>
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
                  max={PROGRAM_DURATION_WEEKS_MAX}
                  value={phase.week}
                  onChange={(e) => onUpdate(i, "week", parseInt(e.target.value) || 1)}
                  className="text-sm"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-xs text-slate-500">{t("phaseTitle")}</label>
                <Input
                  value={phase.title}
                  onChange={(e) => onUpdate(i, "title", e.target.value)}
                  placeholder={t("phaseTitlePlaceholder")}
                  maxLength={FIELD_MAX_TITLE}
                />
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-slate-400 hover:text-red-500 mt-4 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t("phaseGuidance")}</label>
              <textarea
                value={phase.guidance}
                onChange={(e) => onUpdate(i, "guidance", e.target.value)}
                placeholder={t("phaseGuidancePlaceholder")}
                maxLength={FIELD_MAX_LONG}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
