import { Card } from "@/components/ui/card";

export default function ClientsLoading() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-24 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-40 mb-8" />
      <Card className="p-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 bg-slate-100 rounded mb-2" />
        ))}
      </Card>
    </div>
  );
}
