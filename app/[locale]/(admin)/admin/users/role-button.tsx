"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

type Role = "client" | "practitioner" | "admin"

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-teal-50 text-teal-700",
  practitioner: "bg-blue-50 text-blue-600",
  client: "bg-slate-100 text-slate-600",
}


interface RoleButtonProps {
  userId: string
  currentRole: Role
  canEdit: boolean
}

export function RoleButton({ userId, currentRole, canEdit }: RoleButtonProps) {
  const t = useTranslations("admin.users")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleChange(newRole: Role) {
    if (newRole === currentRole) return
    setError(null)

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.error ?? t("errorUpdateRole"))
        return
      }
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setError(t("errorUpdateRole"))
    }
  }

  if (!canEdit) {
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[currentRole]}`}>
        {t(`roles.${currentRole}`)}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        defaultValue={currentRole}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as Role)}
        className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none"
      >
        <option value="client">{t("roles.client")}</option>
        <option value="practitioner">{t("roles.practitioner")}</option>
        <option value="admin">{t("roles.admin")}</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
