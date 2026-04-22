export default function TechniquesAdminLoading() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-8 bg-slate-200 rounded w-36 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-48" />
        </div>
        <div className="h-9 bg-slate-100 rounded-lg w-32" />
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="mb-6 rounded-xl border border-slate-200 bg-white">
          <div className="p-6 border-b border-slate-100">
            <div className="h-5 bg-slate-200 rounded w-32" />
          </div>
          <div className="divide-y divide-slate-100">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-40 mb-1.5" />
                  <div className="h-3 bg-slate-100 rounded w-56" />
                </div>
                <div className="flex gap-2">
                  <div className="h-7 bg-slate-100 rounded-lg w-14" />
                  <div className="h-7 bg-slate-100 rounded-lg w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
