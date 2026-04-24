import { Card } from "@/components/ui/card"

export default function AdminThreadLoading() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-32 mb-6" />
      <div className="h-8 bg-slate-200 rounded w-56 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-40 mb-6" />
      <Card className="p-6">
        <div className="flex flex-col gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
              <div className={`h-14 bg-slate-100 rounded-xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
        <div className="h-12 bg-slate-100 rounded-xl" />
      </Card>
    </div>
  )
}
