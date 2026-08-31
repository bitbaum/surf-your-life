import { Card } from "@/components/ui/card";

export default function AdminCheckInsLoading() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-40 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-72 mb-8" />
      <Card className="p-6">
        <div className="h-5 bg-slate-200 rounded w-32 mb-6" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div className="h-4 bg-slate-100 rounded flex-1" />
            <div className="h-4 bg-slate-100 rounded w-24" />
            <div className="h-4 bg-slate-100 rounded w-20" />
            <div className="h-4 bg-slate-100 rounded w-12" />
            <div className="h-4 bg-slate-100 rounded w-12" />
          </div>
        ))}
      </Card>
    </div>
  );
}
