import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { roundOne } from "@/lib/utils"
import { getTranslations } from "next-intl/server"
import type { WeekDelta } from "@/lib/domain/check-in"

interface Props {
  delta: WeekDelta
}

type DeltaTone = "good" | "bad" | "neutral"

function deltaTone(value: number, higherIsBetter: boolean): DeltaTone {
  if (value === 0) return "neutral"
  const goodDirection = higherIsBetter ? value > 0 : value < 0
  return goodDirection ? "good" : "bad"
}

function DeltaBadge({ value, higherIsBetter, format }: {
  value: number | null
  higherIsBetter: boolean
  format: (n: number) => string
}) {
  if (value == null) {
    return <span className="text-xs text-slate-400">—</span>
  }

  const tone = deltaTone(value, higherIsBetter)
  const colorClass =
    tone === "good" ? "text-teal-700 bg-teal-50"
    : tone === "bad" ? "text-red-700 bg-red-50"
    : "text-slate-600 bg-slate-100"

  const Icon = value === 0 ? Minus : value > 0 ? ArrowUp : ArrowDown

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${colorClass}`}>
      <Icon className="w-3 h-3" />
      {format(Math.abs(value))}
    </span>
  )
}

export async function ClientTrendCard({ delta }: Props) {
  const t = await getTranslations("admin.clients.detail.trend")

  // Hide entirely when there's no current-window data — the check-ins card
  // already covers the "no recent activity" case.
  if (delta.window.count === 0) return null

  const energyValue = delta.window.avgEnergy != null ? `${roundOne(delta.window.avgEnergy)}/10` : "—"
  const stressValue = delta.window.avgStress != null ? `${roundOne(delta.window.avgStress)}/10` : "—"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("title")}</CardTitle>
          <span className="text-xs text-slate-500">
            {t("checkInsCount", { count: delta.window.count })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat
            label={t("avgEnergy")}
            value={energyValue}
            delta={delta.energyDelta}
            higherIsBetter
            hasPriorWindow={delta.hasPriorWindow}
            format={(n) => n.toFixed(1)}
          />
          <Stat
            label={t("pemEpisodes")}
            value={String(delta.window.pemCount)}
            valueClass={delta.window.pemCount > 0 ? "text-red-600" : "text-slate-700"}
            delta={delta.hasPriorWindow ? delta.pemDelta : null}
            higherIsBetter={false}
            hasPriorWindow={delta.hasPriorWindow}
            format={(n) => String(n)}
          />
          <Stat
            label={t("avgStress")}
            value={stressValue}
            delta={delta.stressDelta}
            higherIsBetter={false}
            hasPriorWindow={delta.hasPriorWindow}
            format={(n) => n.toFixed(1)}
          />
        </div>
        {!delta.hasPriorWindow && (
          <p className="text-xs text-slate-400 mt-4">{t("noPriorWindow")}</p>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, valueClass, delta, higherIsBetter, hasPriorWindow, format }: {
  label: string
  value: string
  valueClass?: string
  delta: number | null
  higherIsBetter: boolean
  hasPriorWindow: boolean
  format: (n: number) => string
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <p className={`text-xl font-semibold ${valueClass ?? "text-slate-900"}`}>{value}</p>
        {hasPriorWindow && (
          <DeltaBadge value={delta} higherIsBetter={higherIsBetter} format={format} />
        )}
      </div>
    </div>
  )
}
