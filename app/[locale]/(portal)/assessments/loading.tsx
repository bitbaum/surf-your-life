import { Card } from "@/components/ui/card"

export default function AssessmentsLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-72" />
        </div>
      </div>
      <div className="h-32 bg-slate-100 rounded-xl mb-6" />
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-slate-200 rounded w-28" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 bg-slate-100 rounded" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
