export default function BookingCalendarLoading() {
  return (
    <div className="max-w-6xl mx-auto animate-pulse">
      <div className="h-8 w-40 bg-slate-200 rounded-lg mb-2" />
      <div className="h-4 w-56 bg-slate-100 rounded mb-8" />

      <div className="flex items-center gap-3 mb-6">
        <div className="h-4 w-20 bg-slate-100 rounded" />
        <div className="h-6 w-14 bg-slate-100 rounded-full" />
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex flex-col min-h-32">
            <div className="h-12 bg-slate-200 rounded-t-lg mb-1" />
            <div className="flex flex-col gap-1 flex-1">
              <div className="h-10 bg-slate-100 rounded-lg" />
              {i % 3 === 0 && <div className="h-10 bg-slate-100 rounded-lg" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
