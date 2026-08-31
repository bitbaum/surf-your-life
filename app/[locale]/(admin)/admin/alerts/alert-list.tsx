"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ALERT_SEVERITY_DOT, ALERT_SEVERITY_ORDER } from "@/lib/constants";
import type { AlertType, AlertSeverity } from "@/lib/db/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import type { DayState } from "@/components/ui/day-cadence-sparkline";
import { AlertItem } from "./alert-item";
import { AlertControls } from "./alert-controls";

const ALL_FILTER = "all" as const;
type TypeFilter = AlertType | typeof ALL_FILTER;

export type AlertRow = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  createdAt: Date;
  client: { id: string; name: string | null; email: string };
};

interface Props {
  initialAlerts: AlertRow[];
  sparkDays: string[];
  sparkData: Record<string, { checkedIn: string[]; pemDays: string[] }>;
  sparkLabels: Record<DayState, string>;
  sparkHint: string;
  myClientIds?: string[];
}

export function AlertList({
  initialAlerts,
  sparkDays,
  sparkData,
  sparkLabels,
  sparkHint,
  myClientIds,
}: Props) {
  const t = useTranslations("admin.alerts");
  const [alerts, setAlerts] = useState(initialAlerts);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL_FILTER);
  const [search, setSearch] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [resolvingAll, setResolvingAll] = useState(false);

  function handleResolved(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleResolveAll() {
    const ids = visible.map((a) => a.id);
    if (ids.length === 0) return;
    setResolvingAll(true);
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) setAlerts((prev) => prev.filter((a) => !ids.includes(a.id)));
    } finally {
      setResolvingAll(false);
    }
  }

  const q = search.trim().toLowerCase();
  const bySearch = q
    ? alerts.filter((a) => (a.client.name ?? a.client.email).toLowerCase().includes(q))
    : alerts;
  const searched =
    mineOnly && myClientIds ? bySearch.filter((a) => myClientIds.includes(a.client.id)) : bySearch;
  const activeTypes = [...new Set(searched.map((a) => a.type))] as AlertType[];
  const visible =
    typeFilter === ALL_FILTER ? searched : searched.filter((a) => a.type === typeFilter);

  if (alerts.length === 0) {
    return (
      <Card className="py-16">
        <EmptyState
          icon={
            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
              <span className="text-teal-600 text-lg">✓</span>
            </div>
          }
          message={t("allClear")}
          description={t("allClearSubtext")}
        />
      </Card>
    );
  }

  const grouped = Object.fromEntries(
    ALERT_SEVERITY_ORDER.map((s) => [s, [] as AlertRow[]]),
  ) as Record<AlertSeverity, AlertRow[]>;
  for (const alert of visible) grouped[alert.severity].push(alert);

  return (
    <div className="flex flex-col gap-6">
      <AlertControls
        search={search}
        onSearch={setSearch}
        searched={searched}
        activeTypes={activeTypes}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        visibleCount={visible.length}
        resolvingAll={resolvingAll}
        onResolveAll={handleResolveAll}
        mineOnly={mineOnly}
        onMineOnly={setMineOnly}
        hasMineFilter={(myClientIds?.length ?? 0) > 0}
      />
      {ALERT_SEVERITY_ORDER.map((sev) => {
        const group = grouped[sev];
        if (group.length === 0) return null;
        return (
          <section key={sev}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${ALERT_SEVERITY_DOT[sev]}`} />
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                {t(`severity.${sev}`)} · {group.length}
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {group.map((alert) => {
                const spark = sparkData[alert.client.id];
                return (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    sparkDays={sparkDays}
                    sparkCheckedIn={new Set(spark?.checkedIn ?? [])}
                    sparkPemDays={new Set(spark?.pemDays ?? [])}
                    sparkLabels={sparkLabels}
                    sparkHint={sparkHint}
                    onResolved={handleResolved}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
