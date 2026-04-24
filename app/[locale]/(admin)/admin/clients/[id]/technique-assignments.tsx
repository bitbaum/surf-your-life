"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Plus, Trash2, BookOpen, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Technique } from "@/lib/db/schema"
import type { AssignmentWithTechnique, LogsGridByAssignment } from "@/lib/domain/techniques"
import { TECHNIQUE_CATEGORIES, ADHERENCE_GOOD_DAYS, ADHERENCE_OK_DAYS } from "@/lib/constants"
import { TechniqueAssignForm } from "./technique-assign-form"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function AdherenceBadge({ days }: { days: number }) {
  const color = days >= ADHERENCE_GOOD_DAYS ? "text-teal-600 bg-teal-50" : days >= ADHERENCE_OK_DAYS ? "text-amber-600 bg-amber-50" : "text-red-500 bg-red-50"
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${color}`}>
      {days}/7d
    </span>
  )
}

function AdherenceGrid({ assignmentId, frequencyPerDay, logsGrid }: {
  assignmentId: string
  frequencyPerDay: number
  logsGrid: LogsGridByAssignment
}) {
  // Build the last 7 days ending today using local date (not UTC) so the
  // grid keys match the YYYY-MM-DD dates that clients log against locally.
  const days: { iso: string; label: string }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const label = DAY_LABELS[d.getDay()]
    days.push({ iso, label })
  }

  const grid = logsGrid[assignmentId] ?? {}

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1.5">
      {days.map(({ iso, label }) => {
        const reps = grid[iso] ?? 0
        const met = reps >= frequencyPerDay
        const partial = reps > 0 && !met
        const dotColor = met
          ? "bg-teal-500"
          : partial
          ? "bg-amber-400"
          : "bg-slate-200"
        const textColor = met
          ? "text-teal-600 font-semibold"
          : partial
          ? "text-amber-600"
          : "text-slate-400"

        return (
          <div key={iso} className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-[10px] text-slate-400">{label}</span>
            <div className={`w-5 h-5 rounded-full ${dotColor} flex items-center justify-center`}>
              {reps > 0 && (
                <span className="text-[9px] text-white font-bold leading-none">{reps}</span>
              )}
            </div>
            <span className={`text-[9px] leading-none ${textColor}`}>/{frequencyPerDay}</span>
          </div>
        )
      })}
    </div>
  )
}

interface TechniqueAssignmentsProps {
  clientId: string
  assignments: AssignmentWithTechnique[]
  allTechniques: Technique[]
  adherenceByAssignment: Record<string, number>
  logsGridByAssignment: LogsGridByAssignment
}

export function TechniqueAssignments({ clientId, assignments, allTechniques, adherenceByAssignment, logsGridByAssignment }: TechniqueAssignmentsProps) {
  const t = useTranslations("admin.techniques")
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const assigned = new Set(assignments.map((a) => a.techniqueId))
  const available = allTechniques.filter((t) => !assigned.has(t.id))
  const categoryEmoji = Object.fromEntries(TECHNIQUE_CATEGORIES.map(({ value, emoji }) => [value, emoji]))

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleRemove(assignmentId: string) {
    if (!confirm(t("removeConfirm"))) return
    try {
      const res = await fetch(`/api/technique-assignments/${assignmentId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success(t("removedSuccess"))
        router.refresh()
      } else {
        toast.error(t("saveError"))
      }
    } catch {
      toast.error(t("saveError"))
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            {t("assignedTitle")}
            <span className="text-sm font-normal text-slate-400">({assignments.length})</span>
          </CardTitle>
          {available.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => setAdding(!adding)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t("assign")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {adding && (
          <TechniqueAssignForm
            clientId={clientId}
            available={available}
            categoryEmoji={categoryEmoji}
            onSaved={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        )}

        {assignments.length === 0 ? (
          <p className="text-slate-400 text-sm">{t("noAssignments")}</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {assignments.map((a) => {
              const isOpen = expanded.has(a.id)
              return (
                <div key={a.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => toggleExpand(a.id)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOpen
                          ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        }
                        <span className="text-sm font-medium text-slate-800">{a.technique.name}</span>
                        <span className="text-xs text-slate-400">
                          {categoryEmoji[a.technique.category]} {t(`category.${a.technique.category}` as Parameters<typeof t>[0])}
                        </span>
                        <span className="text-xs text-teal-600 font-medium">
                          {a.frequencyPerDay}× {t("perDay")}
                        </span>
                        <AdherenceBadge days={adherenceByAssignment[a.id] ?? 0} />
                      </div>
                      {a.notes && <p className="text-xs text-slate-400 mt-0.5 italic pl-5">{a.notes}</p>}
                    </button>
                    <button
                      onClick={() => handleRemove(a.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                      title={t("remove")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {isOpen && (
                    <div className="pl-5">
                      <AdherenceGrid
                        assignmentId={a.id}
                        frequencyPerDay={a.frequencyPerDay}
                        logsGrid={logsGridByAssignment}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
