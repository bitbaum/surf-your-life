"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { CheckCircle2, Circle, RotateCcw } from "lucide-react"
import type { Technique, TechniqueAssignment } from "@/lib/db/schema"
import { computeTechniqueDebt, type LogByDate } from "@/lib/domain/techniques"
import { TECHNIQUE_CATEGORIES } from "@/lib/constants"

type AssignmentWithTechnique = TechniqueAssignment & { technique: Technique }

interface TechniqueTrackerProps {
  assignments: AssignmentWithTechnique[]
  logsByAssignment: Record<string, LogByDate>
  today: string
}

export function TechniqueTracker({ assignments, logsByAssignment, today }: TechniqueTrackerProps) {
  const t = useTranslations("portal.techniques")
  const [logs, setLogs] = useState(logsByAssignment)
  const [submitting, setSubmitting] = useState<string | null>(null)

  const categoryEmoji = Object.fromEntries(TECHNIQUE_CATEGORIES.map(({ value, emoji }) => [value, emoji]))

  async function logRep(assignment: AssignmentWithTechnique) {
    if (submitting) return
    setSubmitting(assignment.id)
    try {
      const current = (logs[assignment.id]?.[today] ?? 0)
      const res = await fetch("/api/technique-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: assignment.id,
          date: today,
          completedReps: current + 1,
        }),
      })
      if (!res.ok) throw new Error()
      // Optimistic update: add one rep for today
      setLogs((prev) => ({
        ...prev,
        [assignment.id]: {
          ...(prev[assignment.id] ?? {}),
          [today]: current + 1,
        },
      }))
      toast.success(t("loggedSuccess"))
    } catch {
      toast.error(t("logError"))
    } finally {
      setSubmitting(null)
    }
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-sm">{t("empty")}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {assignments.map((a) => {
        const debt = computeTechniqueDebt(a, logs[a.id] ?? {}, today)
        const todayDone = debt.todayCompleted
        const targetMet = todayDone >= debt.dailyTarget
        const hasDebt = debt.catchUpReps > 0

        return (
          <div
            key={a.id}
            className={`rounded-xl border p-4 transition-colors ${
              targetMet ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">{categoryEmoji[a.technique.category]}</span>
                  <p className="text-sm font-semibold text-slate-900">{a.technique.name}</p>
                  {a.technique.durationMinutes && (
                    <span className="text-xs text-slate-400">{a.technique.durationMinutes} min</span>
                  )}
                </div>
                {a.technique.description && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.technique.description}</p>
                )}
                {a.notes && (
                  <p className="text-xs text-teal-700 mt-1 italic">{a.notes}</p>
                )}
              </div>

              {/* Rep counter */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => logRep(a)}
                  disabled={!!submitting}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                    targetMet
                      ? "bg-teal-600 text-white"
                      : "bg-white border-2 border-teal-300 text-teal-600 hover:bg-teal-50"
                  } disabled:opacity-50`}
                  title={t("logOne")}
                >
                  {targetMet ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <span className="text-xs text-slate-500">
                  {todayDone}/{debt.dailyTarget}
                </span>
              </div>
            </div>

            {/* Progress dots for daily target */}
            {debt.dailyTarget > 1 && (
              <div className="flex gap-1.5 mt-3">
                {Array.from({ length: debt.dailyTarget }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < todayDone ? "bg-teal-500" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Catch-up nudge */}
            {hasDebt && !targetMet && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  {t("catchUp", { reps: debt.catchUpReps })}
                </p>
              </div>
            )}

            {/* Instructions (collapsed by default) */}
            {a.technique.instructions && (
              <details className="mt-3">
                <summary className="text-xs text-teal-600 cursor-pointer hover:underline select-none">
                  {t("howTo")}
                </summary>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                  {a.technique.instructions}
                </p>
              </details>
            )}
          </div>
        )
      })}
    </div>
  )
}
