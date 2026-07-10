export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full p-1 max-w-7xl mx-auto">
      {/* ── Welcome Header Shimmer ── */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/60 p-6 sm:p-8 bg-white shadow-xs">
        <div className="space-y-3">
          <div className="h-8 w-48 rounded-lg animate-shimmer" />
          <div className="h-4 w-3/4 max-w-lg rounded-md animate-shimmer" />
        </div>
      </div>

      {/* ── Metrics Grid Shimmer ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-xs border border-slate-200/60 p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-lg animate-shimmer" />
              <div className="w-16 h-5 rounded-full animate-shimmer" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-7 w-28 rounded-md animate-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Queue Monitor Shimmer ── */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 sm:p-6 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="h-5 w-40 rounded animate-shimmer" />
          <div className="h-8 w-24 rounded-lg animate-shimmer" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-1/4 rounded animate-shimmer" />
                <div className="h-3 w-1/2 rounded animate-shimmer" />
              </div>
              <div className="h-5 w-16 rounded-full animate-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions Launchpad Shimmer ── */}
      <div className="space-y-3">
        <div className="h-5 w-44 rounded animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-5 bg-white rounded-xl border border-slate-200/60 flex flex-col justify-between min-h-[140px]">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-lg animate-shimmer" />
                <div className="h-4 w-28 rounded animate-shimmer" />
                <div className="h-3 w-full rounded animate-shimmer" />
              </div>
              <div className="h-3 w-16 rounded mt-4 animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
