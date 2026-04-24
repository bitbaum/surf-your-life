"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { computeTechniqueDebt, type LogByDate, type AssignmentWithTechnique } from "@/lib/domain/techniques"
import { TECHNIQUE_CATEGORIES } from "@/lib/constants"
import { TechniqueCard } from "./technique-card"
import { EmptyState } from "@/components/ui/empty-state"

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
    return <EmptyState message={t("empty")} className="py-12" />
  }

  return (
    <div className="flex flex-col gap-4">
      {assignments.map((a) => (
        <TechniqueCard
          key={a.id}
          assignment={a}
          debt={computeTechniqueDebt(a, logs[a.id] ?? {}, today)}
          categoryEmoji={categoryEmoji}
          submitting={submitting}
          onLog={logRep}
        />
      ))}
    </div>
  )
}
