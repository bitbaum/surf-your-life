import { Card } from "@/components/ui/card"

export default function ServicesLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 rounded w-36 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-48" />
      </div>
      <Card>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-40 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-56" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-slate-100 rounded-lg w-16" />
              <div className="h-8 bg-slate-100 rounded-lg w-16" />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
