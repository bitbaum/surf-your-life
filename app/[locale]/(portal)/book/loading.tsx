export default function BookLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48 mb-2" />
      <div className="h-4 bg-slate-100 rounded w-64 mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 h-24" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 h-48" />
    </div>
  )
}
