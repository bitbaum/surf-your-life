"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

type Stats = {
  alertCount: number
  highAlertCount: number
  pemCount: number
  latestEnergy: number | null
  avgEnergy: number | null
  energyDirection: "up" | "down" | "stable"
  checkInCount: number
}

const DIRECTION_ICON: Record<string, string> = { up: "↑", down: "↓", stable: "→" }
const DIRECTION_COLOR: Record<string, string> = { up: "text-teal-600", down: "text-red-500", stable: "text-slate-500" }

interface Props {
  clientId: string
}

export function SessionPrep({ clientId }: Props) {
  const t = useTranslations("admin.clients.sessionPrep")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerate() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/session-prep`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setSummary(json.data.summary)
      setStats(json.data.stats ?? null)
      setAiGenerated(json.data.aiGenerated)
    } catch {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            {t("title")}
          </CardTitle>
          {!summary && (
            <Button size="sm" variant="outline" onClick={handleGenerate} disabled={loading}>
              {loading ? t("generating") : t("generate")}
            </Button>
          )}
          {summary && (
            <button
              onClick={() => { setSummary(null); setStats(null); setError("") }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              {t("refresh")}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!summary && !error && (
          <p className="text-sm text-slate-400">{t("description")}</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {summary && (
          <div>
            {stats && (
              <div className="flex flex-wrap gap-3 mb-4 pb-3 border-b border-slate-100">
                {stats.latestEnergy != null && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">{t("statsEnergy")}</span>
                    <span className={`text-sm font-semibold ${DIRECTION_COLOR[stats.energyDirection]}`}>
                      {stats.latestEnergy}/10 {DIRECTION_ICON[stats.energyDirection]}
                    </span>
                  </div>
                )}
                {stats.alertCount > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">{t("statsAlerts")}</span>
                    <span className={`text-sm font-semibold ${stats.highAlertCount > 0 ? "text-red-600" : "text-amber-600"}`}>
                      {stats.alertCount}{stats.highAlertCount > 0 ? ` ${t("statsHighAlerts", { count: stats.highAlertCount })}` : ""}
                    </span>
                  </div>
                )}
                {stats.pemCount > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-slate-400">{t("statsPem")}</span>
                    <span className="text-sm font-semibold text-red-600">{stats.pemCount}×</span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-400">{t("statsCheckIns")}</span>
                  <span className="text-sm font-semibold text-slate-700">{stats.checkInCount}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            {!aiGenerated && (
              <p className="text-xs text-slate-400 mt-2 italic">{t("ruleBasedNote")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
