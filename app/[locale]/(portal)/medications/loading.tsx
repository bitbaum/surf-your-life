export default function MedicationsLoading() {
  return (
    <div className="max-w-xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 rounded w-44 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-64" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-3 border-b border-slate-100">
            <div className="h-4 bg-slate-200 rounded w-40 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-56" />
          </div>
        ))}
        <div className="mt-4 h-9 bg-slate-100 rounded-lg w-32" />
      </div>
    </div>
  )
}
