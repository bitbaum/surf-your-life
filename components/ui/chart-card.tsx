import type { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  title: string
  subtitle?: string
  /** Optional right-aligned element in the header (e.g. a "View all →" link). */
  action?: ReactNode
  /** Extra classes for the outer Card (e.g. "mb-6"). */
  className?: string
  children: ReactNode
}

export function ChartCard({ title, subtitle, action, className, children }: Props) {
  const titleBlock = (
    <div>
      <CardTitle>{title}</CardTitle>
      {subtitle && <p className="text-xs text-ink-faint mt-0.5">{subtitle}</p>}
    </div>
  )
  return (
    <Card className={className}>
      <CardHeader>
        {action ? (
          <div className="flex items-center justify-between">
            {titleBlock}
            {action}
          </div>
        ) : (
          titleBlock
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
