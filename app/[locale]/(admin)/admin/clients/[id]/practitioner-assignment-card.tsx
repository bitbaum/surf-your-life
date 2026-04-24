"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"

type Practitioner = { id: string; name: string | null; email: string }

type Assignment = {
  id: string
  practitionerId: string
  practitionerName: string | null
  practitionerEmail: string
  assignedAt: Date
}

interface Props {
  clientId: string
  current: Assignment | null
  practitioners: Practitioner[]
}

export function PractitionerAssignmentCard({ clientId, current, practitioners }: Props) {
  const t = useTranslations("admin.clients.detail")
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleAssign() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, practitionerId: selected }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
      setEditing(false)
      setSelected("")
    } catch {
      toast.error(t("assignError"))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!current) return
    setSaving(true)
    try {
      const res = await fetch(`/api/assignments/${current.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      router.refresh()
    } catch {
      toast.error(t("assignError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-teal-600" />
          {t("assignmentCard")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex items-center gap-2">
            <Select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="flex-1"
            >
              <option value="">{t("selectPractitioner")}</option>
              {practitioners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.email}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={handleAssign} disabled={!selected || saving}>
              {saving ? t("saving") : t("assignPractitioner")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setSelected("") }}>
              {t("cancel")}
            </Button>
          </div>
        ) : current ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{current.practitionerName ?? current.practitionerEmail}</p>
              <p className="text-xs text-slate-400">{t("assignedSince", { date: formatDate(current.assignedAt) })}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={saving}>
                {t("changePractitioner")}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRemove} disabled={saving}
                className="text-red-500 hover:text-red-700 hover:bg-red-50">
                {t("removePractitioner")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-400">{t("unassigned")}</p>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              {t("assignPractitioner")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
