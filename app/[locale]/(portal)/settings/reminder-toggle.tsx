"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";

interface Props {
  initialValue: boolean;
}

export function ReminderToggle({ initialValue }: Props) {
  const t = useTranslations("portal.settings");
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const next = !enabled;
    setLoading(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiveReminders: next }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setEnabled(next);
      toast.success(next ? t("remindersEnabled") : t("remindersDisabled"));
    } catch {
      toast.error(t("remindersSaveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {enabled ? (
          <Bell className="w-4 h-4 text-teal-600" />
        ) : (
          <BellOff className="w-4 h-4 text-slate-400" />
        )}
        <div>
          <p className="text-sm font-medium text-slate-900">{t("remindersDailyLabel")}</p>
          <p className="text-xs text-slate-500">{t("remindersDescription")}</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-pressed={enabled}
        aria-label={enabled ? t("remindersDisableAriaLabel") : t("remindersEnableAriaLabel")}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          enabled ? "bg-teal-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
