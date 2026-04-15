"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Pencil, Archive } from "lucide-react"
import type { Technique } from "@/lib/db/schema"
import { TechniqueForm } from "./technique-form"

export function TechniqueActions({ technique }: { technique: Technique }) {
  const t = useTranslations("admin.techniques")
  const router = useRouter()
  const [editing, setEditing] = useState(false)

  async function handleArchive() {
    if (!confirm(t("archiveConfirm"))) return
    const res = await fetch(`/api/techniques/${technique.id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success(t("archivedSuccess"))
      router.refresh()
    } else {
      toast.error(t("saveError"))
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title={t("edit")}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {technique.isActive && (
          <button
            onClick={handleArchive}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
            title={t("archive")}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {editing && (
        <TechniqueForm
          technique={technique}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); router.refresh() }}
        />
      )}
    </>
  )
}
