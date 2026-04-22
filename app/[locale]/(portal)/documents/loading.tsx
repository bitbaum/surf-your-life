export default function DocumentsLoading() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 bg-slate-200 rounded w-36 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-56" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-32" />
              </div>
              <div className="h-8 bg-slate-100 rounded-lg w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
