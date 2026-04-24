import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function NewProgramLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-32 mb-6" />
      <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-64 mb-8" />
      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-20 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-100 rounded" />
            <div className="h-10 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-100 rounded w-40" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-9 bg-slate-200 rounded w-24" />
            <div className="h-9 bg-slate-100 rounded w-20" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
