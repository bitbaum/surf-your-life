import { Card } from "@/components/ui/card";

export default function AiChatLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-72" />
      </div>
      <Card className="p-6">
        <div className="h-5 bg-slate-200 rounded w-40 mb-6" />
        <div className="flex flex-col gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
              <div className={`h-12 bg-slate-100 rounded-xl ${i % 2 === 0 ? "w-48" : "w-64"}`} />
            </div>
          ))}
        </div>
        <div className="h-12 bg-slate-100 rounded-xl" />
      </Card>
    </div>
  );
}
