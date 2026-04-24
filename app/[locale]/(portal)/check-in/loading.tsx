import { Card } from "@/components/ui/card"

export default function CheckInLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-40 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-56 mb-8" />
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 mb-6 h-40" />
      ))}
    </div>
  )
}
