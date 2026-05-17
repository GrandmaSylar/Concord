export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse p-2">
      <div className="space-y-3">
        <div className="h-8 bg-slate-200 rounded-md w-1/4"></div>
        <div className="h-4 bg-slate-200 rounded-md w-2/5"></div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-slate-100 rounded-xl border border-slate-200"></div>
          <div className="h-40 bg-slate-100 rounded-xl border border-slate-200"></div>
        </div>
        <div className="space-y-6">
          <div className="h-96 bg-slate-100 rounded-xl border border-slate-200"></div>
        </div>
      </div>
    </div>
  )
}
