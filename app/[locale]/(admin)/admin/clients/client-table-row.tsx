import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"

type ClientRow = {
  id: string
  name: string | null
  email: string
  createdAt: Date
  mainConcern: string | null
  lastCheckIn: Date | null
  checkInCount: number
}

type AlertInfo = { count: number; hasHigh: boolean }

interface Props {
  client: ClientRow
  alert: AlertInfo | undefined
  viewLabel: string
}

export function ClientTableRow({ client, alert, viewLabel }: Props) {
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
        </span>
      </td>
      <td className="py-3 text-slate-600">{client.email}</td>
      <td className="py-3 text-slate-500">
        {client.mainConcern ? formatEnumValue(client.mainConcern) : "—"}
      </td>
      <td className="py-3 text-slate-500">
        {client.lastCheckIn ? formatDate(client.lastCheckIn) : <span className="text-slate-300">—</span>}
      </td>
      <td className="py-3 text-slate-500">
        {client.checkInCount > 0 ? client.checkInCount : <span className="text-slate-300">0</span>}
      </td>
      <td className="py-3 text-slate-400">{formatDate(client.createdAt)}</td>
      <td className="py-3 text-right">
        <Link
          href={`/admin/clients/${client.id}`}
          className="text-teal-600 hover:underline text-xs font-medium"
        >
          {viewLabel}
        </Link>
      </td>
    </tr>
  )
}
