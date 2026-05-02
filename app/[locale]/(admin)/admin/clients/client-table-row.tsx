import { Link } from "@/i18n/navigation"
import { formatDate } from "@/lib/utils"
import { getTranslations } from "next-intl/server"
import { NewThreadButton } from "./[id]/new-thread-button"
import { DayCadenceSparkline, type DayState } from "@/components/ui/day-cadence-sparkline"
import { MessageSquare } from "lucide-react"

export type ClientRow = {
  id: string
  name: string | null
  email: string
  createdAt: Date
  mainConcern: string | null
  lastCheckIn: Date | null
  checkInCount: number
}

type AlertInfo = { count: number; hasHigh: boolean }

type NudgeProps = {
  label: string
  modalTitle: string
  subject: string
  body: string
}

interface Props {
  client: ClientRow
  alert: AlertInfo | undefined
  unreadMessages: number
  energyTrend: "up" | "down" | "stable" | null
  isStale: boolean
  staleHint: string
  viewLabel: string
  sparkDays: string[]
  sparkCheckedIn: Set<string>
  sparkPemDays: Set<string>
  sparkHint: string
  sparkDayLabels: Record<DayState, string>
  nudge?: NudgeProps | null
}

export async function ClientTableRow({ client, alert, unreadMessages, energyTrend, isStale, staleHint, viewLabel, sparkDays, sparkCheckedIn, sparkPemDays, sparkHint, sparkDayLabels, nudge }: Props) {
  const tConcerns = await getTranslations("concerns")
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
      <td className="py-3 font-medium text-slate-800">
        <span className="flex items-center gap-2">
          <Link href={`/admin/clients/${client.id}`} className="hover:text-teal-700 transition-colors">
            {client.name ?? "—"}
          </Link>
          {(alert?.count ?? 0) > 0 && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${alert!.hasHigh ? "text-white bg-red-600" : "text-red-600 bg-red-50"}`}>
              {alert!.count}
            </span>
          )}
          {unreadMessages > 0 && (
            <Link
              href={`/admin/messages?client=${client.id}&filter=unread`}
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors leading-none"
            >
              <MessageSquare className="w-2.5 h-2.5" />
              {unreadMessages}
            </Link>
          )}
        </span>
      </td>
      <td className="py-3 text-slate-600">{client.email}</td>
      <td className="py-3 text-slate-500">
        {client.mainConcern ? tConcerns(client.mainConcern as Parameters<typeof tConcerns>[0]) : "—"}
      </td>
      <td className="py-3 text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5">
            {isStale && (
              <span
                aria-label={staleHint}
                title={staleHint}
                className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"
              />
            )}
            {client.lastCheckIn ? formatDate(client.lastCheckIn) : <span className="text-slate-300">—</span>}
          </span>
          <DayCadenceSparkline days={sparkDays} checkedIn={sparkCheckedIn} pemDays={sparkPemDays} hint={sparkHint} dayLabels={sparkDayLabels} />
        </span>
      </td>
      <td className="py-3 text-slate-500">
        <span className="inline-flex items-center gap-1">
          {client.checkInCount > 0 ? client.checkInCount : <span className="text-slate-300">0</span>}
          {energyTrend === "up" && <span className="text-teal-600 text-xs font-semibold leading-none" title="Energy improving (7-day avg)">↑</span>}
          {energyTrend === "down" && <span className="text-red-500 text-xs font-semibold leading-none" title="Energy declining (7-day avg)">↓</span>}
          {energyTrend === "stable" && <span className="text-slate-400 text-xs leading-none" title="Energy stable (7-day avg)">→</span>}
        </span>
      </td>
      <td className="py-3 text-slate-400">{formatDate(client.createdAt)}</td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/admin/clients/${client.id}`}
            className="text-teal-600 hover:underline text-xs font-medium"
          >
            {viewLabel}
          </Link>
          {nudge && (
            <NewThreadButton
              clientId={client.id}
              label={nudge.label}
              modalTitle={nudge.modalTitle}
              defaultSubject={nudge.subject}
              defaultBody={nudge.body}
            />
          )}
        </div>
      </td>
    </tr>
  )
}
