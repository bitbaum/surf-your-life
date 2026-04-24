export default function ProgressLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 rounded w-36 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-64" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="h-3 bg-slate-100 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-200 rounded w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-5 bg-slate-200 rounded w-32 mb-4" />
        <div className="h-40 bg-slate-100 rounded" />
      </div>
    </div>
  )
}
