import { useTranslations } from "next-intl";
import type { SessionPrepStats as Stats } from "@/lib/db/schema";

const DIRECTION_ICON: Record<Stats["energyDirection"], string> = {
  up: "↑",
  down: "↓",
  stable: "→",
};
const DIRECTION_COLOR: Record<Stats["energyDirection"], string> = {
  up: "text-brand",
  down: "text-error",
  stable: "text-ink-muted",
};

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ink-faint">{label}</span>
      {children}
    </div>
  );
}

/** The structured snapshot shown above a session prep summary. */
export function SessionPrepStats({ stats }: { stats: Stats }) {
  const t = useTranslations("admin.clients.sessionPrep");
  return (
    <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b border-border-subtle">
      {stats.latestEnergy != null && (
        <Stat label={t("statsEnergy")}>
          <span className={`text-sm font-semibold ${DIRECTION_COLOR[stats.energyDirection]}`}>
            {stats.latestEnergy}/10 {DIRECTION_ICON[stats.energyDirection]}
          </span>
        </Stat>
      )}
      {stats.alertCount > 0 && (
        <Stat label={t("statsAlerts")}>
          <span
            className={`text-sm font-semibold ${stats.highAlertCount > 0 ? "text-error" : "text-warning"}`}
          >
            {stats.alertCount}
            {stats.highAlertCount > 0
              ? ` ${t("statsHighAlerts", { count: stats.highAlertCount })}`
              : ""}
          </span>
        </Stat>
      )}
      {stats.pemCount > 0 && (
        <Stat label={t("statsPem")}>
          <span className="text-sm font-semibold text-error">{stats.pemCount}×</span>
        </Stat>
      )}
      <Stat label={t("statsCheckIns")}>
        <span className="text-sm font-semibold text-ink-soft">{stats.checkInCount}</span>
      </Stat>
      {stats.techniqueAdherence != null && (
        <Stat label={t("statsTechniqueAdherence")}>
          <span className="text-sm font-semibold text-brand">
            {stats.techniqueAdherence}% · {stats.techniqueStreak}d
          </span>
        </Stat>
      )}
    </div>
  );
}
