import { Card } from "@/components/ui/card"

export default function TechniquesLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 rounded w-40 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-64" />
      </div>
      {[1, 2].map((i) => (
        <Card key={i} className="mb-6 p-6">
          <div className="h-5 bg-slate-200 rounded w-32 mb-4" />
          {[1, 2, 3].map((j) => (
            <div key={j} className="py-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="h-4 bg-slate-200 rounded w-36 mb-1.5" />
                <div className="h-3 bg-slate-100 rounded w-52" />
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-20" />
            </div>
          ))}
        </Card>
      ))}
    </div>
  )
}
