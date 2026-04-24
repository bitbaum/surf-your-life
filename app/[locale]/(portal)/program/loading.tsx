import { Card } from "@/components/ui/card"

export default function ProgramLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-32 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-48 mb-8" />
      <Card className="p-6 mb-6">
        <div className="h-6 bg-slate-200 rounded w-48 mb-4" />
        <div className="h-4 bg-slate-100 rounded w-full mb-2" />
        <div className="h-4 bg-slate-100 rounded w-3/4 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg bg-slate-50 p-4 h-16" />
          ))}
        </div>
      </Card>
    </div>
  )
}
