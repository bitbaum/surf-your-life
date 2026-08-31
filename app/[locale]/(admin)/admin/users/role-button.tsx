"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CLIENT_ROLE, PRACTITIONER_ROLE, ADMIN_ROLE, type AppRole } from "@/lib/domain/auth";
import { Badge } from "@/components/ui/badge";
import { ROLE_BADGE_VARIANT } from "@/lib/constants";

interface RoleButtonProps {
  userId: string;
  currentRole: AppRole;
  canEdit: boolean;
}

export function RoleButton({ userId, currentRole, canEdit }: RoleButtonProps) {
  const t = useTranslations("admin.users");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newRole: AppRole) {
    if (newRole === currentRole) return;
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? t("errorUpdateRole"));
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError(t("errorUpdateRole"));
    }
  }

  if (!canEdit) {
    return (
      <Badge
        variant={ROLE_BADGE_VARIANT[currentRole] ?? "slate"}
        label={t(`roles.${currentRole}`)}
      />
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        defaultValue={currentRole}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as AppRole)}
        className="text-xs rounded-lg border border-slate-200 px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:pointer-events-none"
      >
        <option value={CLIENT_ROLE}>{t("roles.client")}</option>
        <option value={PRACTITIONER_ROLE}>{t("roles.practitioner")}</option>
        <option value={ADMIN_ROLE}>{t("roles.admin")}</option>
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
