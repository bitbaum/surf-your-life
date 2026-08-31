import { Card } from "@/components/ui/card";

export default function MessagesLoading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-8 w-40 rounded-lg bg-slate-200 animate-pulse mb-2" />
      <div className="h-4 w-56 rounded bg-slate-100 animate-pulse mb-6" />
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
                <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
                <div className="h-3 w-64 rounded bg-slate-100 animate-pulse" />
              </div>
              <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
