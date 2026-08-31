export default function UsersLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-48 bg-slate-100 rounded animate-pulse mb-8" />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mb-6" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-6 w-28 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
