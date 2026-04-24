import { Card } from "@/components/ui/card"

export default function CheckInsLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-32 mb-6" />
      <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-64 mb-6" />
      <Card className="p-6">
        <div className="h-5 bg-slate-200 rounded w-32 mb-6" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="py-3 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-slate-200 rounded w-28" />
              <div className="h-3 bg-slate-100 rounded w-20" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-48" />
          </div>
        ))}
      </Card>
    </div>
  )
}
