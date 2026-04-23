"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Plus, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Technique, TechniqueAssignment } from "@/lib/db/schema"
import { formatEnumValue } from "@/lib/utils"
import { TECHNIQUE_CATEGORIES } from "@/lib/constants"
import { TechniqueAssignForm } from "./technique-assign-form"

type AssignmentWithTechnique = TechniqueAssignment & { technique: Technique }

interface TechniqueAssignmentsProps {
  clientId: string
  assignments: AssignmentWithTechnique[]
  allTechniques: Technique[]
}

export function TechniqueAssignments({ clientId, assignments, allTechniques }: TechniqueAssignmentsProps) {
  const t = useTranslations("admin.techniques")
  const router = useRouter()
  const [adding, setAdding] = useState(false)

  const assigned = new Set(assignments.map((a) => a.techniqueId))
  const available = allTechniques.filter((t) => !assigned.has(t.id))
  const categoryEmoji = Object.fromEntries(TECHNIQUE_CATEGORIES.map(({ value, emoji }) => [value, emoji]))

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
            {assignments.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800">{a.technique.name}</span>
                    <span className="text-xs text-slate-400">
                      {categoryEmoji[a.technique.category]} {formatEnumValue(a.technique.category)}
                    </span>
                    <span className="text-xs text-teal-600 font-medium">
                      {a.frequencyPerDay}× {t("perDay")}
                    </span>
                  </div>
                  {a.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{a.notes}</p>}
                </div>
                <button
                  onClick={() => handleRemove(a.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title={t("remove")}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
