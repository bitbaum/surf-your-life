"use client";

import { useTranslations } from "next-intl";
import { ResolveAlertButton } from "../../alerts/resolve-button";
import { formatDate } from "@/lib/utils";
import { ALERT_SEVERITY_BADGE } from "@/lib/constants";
import type { ClientAlertRow } from "./client-alerts-card";

interface Props {
  alert: ClientAlertRow;
  onResolved?: (id: string) => void;
  showResolveButton: boolean;
}

export function AlertRow({ alert, onResolved, showResolveButton }: Props) {
  const t = useTranslations("admin.alerts");
  return (
    <div
      className={`flex items-start gap-3 py-2 border-b border-slate-100 last:border-0 ${alert.isResolved ? "opacity-60" : ""}`}
    >
      <span
        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5 ${ALERT_SEVERITY_BADGE[alert.severity]}`}
      >
        {t(`severity.${alert.severity}`)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{alert.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
        <p className="text-xs text-slate-400 mt-1">{formatDate(alert.createdAt)}</p>
      </div>
      <div className="flex-shrink-0 pt-0.5 text-right">
        {showResolveButton && onResolved ? (
          <ResolveAlertButton alertId={alert.id} onResolved={onResolved} />
        ) : (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-slate-400 font-medium">{t("resolvedLabel")}</span>
            {alert.resolvedAt && (
              <span className="text-[10px] text-slate-300">{formatDate(alert.resolvedAt)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
