import { Card } from "@/components/ui/card";

export default function AdminNewMessageLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-32 mb-6" />
      <div className="h-8 bg-slate-200 rounded w-48 mb-8" />
      <Card className="p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-4 bg-slate-200 rounded w-16" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-4 bg-slate-200 rounded w-20" />
          <div className="h-10 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-4 bg-slate-200 rounded w-24" />
          <div className="h-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-10 bg-slate-200 rounded-lg w-32" />
      </Card>
    </div>
  );
}
