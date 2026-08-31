import { Card } from "@/components/ui/card";

export default function LeadsLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-24 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-48 mb-8" />
      <Card className="p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded mb-3" />
        ))}
      </Card>
    </div>
  );
}
