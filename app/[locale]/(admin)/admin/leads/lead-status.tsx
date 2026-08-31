"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { leadStatusEnum } from "@/lib/db/schema";

type LeadStatus = (typeof leadStatusEnum.enumValues)[number];

interface Props {
  leadId: string;
  currentStatus: LeadStatus;
}

const STATUS_BADGE: Record<LeadStatus, string> = {
  new: "bg-slate-100 text-slate-600",
  contacted: "bg-teal-50 text-teal-700",
  dismissed: "bg-red-50 text-red-600",
};

const STATUS_ACTIVE: Record<LeadStatus, string> = {
  new: "bg-slate-200 text-slate-800 font-semibold",
  contacted: "bg-teal-100 text-teal-800 font-semibold",
  dismissed: "bg-red-100 text-red-700 font-semibold",
};

export function LeadStatus({ leadId, currentStatus }: Props) {
  const t = useTranslations("admin.leads");
  const router = useRouter();
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const STATUS_LABELS: Record<LeadStatus, string> = {
    new: t("statusNew"),
    contacted: t("statusContacted"),
    dismissed: t("statusDismissed"),
  };

  const MARK_AS_TITLES: Record<LeadStatus, string> = {
    new: t("markAsNew"),
    contacted: t("markAsContacted"),
    dismissed: t("markAsDismissed"),
  };

  async function handleChange(next: LeadStatus) {
    if (next === status || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setStatus(next);
        router.refresh();
      }
    } catch {
      // silently ignore; status remains unchanged
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {leadStatusEnum.enumValues.map((s) => (
        <button
          key={s}
          onClick={() => handleChange(s)}
          disabled={loading}
          className={`px-2 py-0.5 rounded-full text-xs transition-all disabled:opacity-50 ${
            status === s
              ? STATUS_ACTIVE[s]
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          }`}
          title={MARK_AS_TITLES[s]}
        >
          {STATUS_LABELS[s]}
        </button>
      ))}
      <span
        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}
        aria-label={t("currentStatus")}
      >
        {STATUS_LABELS[status]}
      </span>
    </div>
  );
}
