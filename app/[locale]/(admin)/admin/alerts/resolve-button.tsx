"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";

interface Props {
  alertId: string;
  onResolved: (id: string) => void;
}

export function ResolveAlertButton({ alertId, onResolved }: Props) {
  const t = useTranslations("admin.alerts");
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/alerts/${alertId}`, { method: "PATCH" });
      if (res.ok) onResolved(alertId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleResolve}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 transition-colors disabled:opacity-50"
      title={t("resolve")}
    >
      <CheckCircle className="w-4 h-4" />
      {t("resolve")}
    </button>
  );
}
