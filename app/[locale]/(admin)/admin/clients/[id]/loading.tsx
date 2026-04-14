export default function ClientDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-40 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-56 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="h-5 bg-slate-200 rounded w-32 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-slate-100 rounded mb-3" />
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="h-5 bg-slate-200 rounded w-32 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-slate-100 rounded mb-3" />
          ))}
        </div>
      </div>
    </div>
  )
}
