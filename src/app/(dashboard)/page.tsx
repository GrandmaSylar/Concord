import { getDashboardStats } from './reports/actions'
import { 
  Users, 
  Send, 
  Clock, 
  Activity, 
  ArrowUpRight, 
  BarChart3, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Smartphone, 
  UserPlus, 
  Calendar, 
  FileText 
} from 'lucide-react'
import Link from 'next/link'

function formatTimeAgo(dateString: string | null) {
  if (!dateString) return 'Pending'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  return `${diffDays}d ago`
}

export default async function DashboardOverview() {
  const stats = await getDashboardStats()
  
  // Calculate deliverability rate
  const totalSMS = stats.totalMessagesSent + stats.totalMessagesFailed
  const successRate = totalSMS > 0 ? Math.round((stats.totalMessagesSent / totalSMS) * 100) : 100

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-12">
      {/* ── Dynamic Welcome Dashboard Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r bg-theme-primary/10 border border-theme-primary/20 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-theme-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome to <span className="text-theme-primary">Concord</span> SMS
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-xl">
            Streamline your voter interactions, manage constituency demographic targets, and track bulk SMS diagnostics.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200/80 px-4 py-2.5 shadow-sm relative z-10">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">Gateway API Online</span>
        </div>
      </div>

      {/* ── Gorgeous Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Contacts */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Database
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Total Constituents</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalContacts.toLocaleString()}</p>
          </div>
        </div>

        {/* Metric 2: Gateway Success Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {successRate}% Success
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Gateway Deliverability</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-slate-900">{stats.totalMessagesSent.toLocaleString()}</p>
              <p className="text-xs text-slate-400">delivered</p>
            </div>
          </div>
        </div>

        {/* Metric 3: Active Outgoing Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
              <Send className="w-6 h-6" />
            </div>
            {stats.totalMessagesPending > 0 ? (
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full animate-pulse">
                {stats.totalMessagesPending} pending
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Queue Empty
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Outgoing Campaigns</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-bold text-slate-900">
                {(stats.totalMessagesSent + stats.totalMessagesFailed + stats.totalMessagesPending).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">total dispatches</p>
            </div>
          </div>
        </div>

        {/* Metric 4: Scheduled Workflows */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 hover:-translate-y-1 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              Automated
            </span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-500">Pending Reminders</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stats.pendingReminders.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions Launchpad ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          Quick Navigation Launchpad
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/send" 
            className="group flex flex-col justify-between p-5 rounded-xl bg-white border border-slate-200/80 hover:border-theme-primary/30 hover:bg-slate-50/50 shadow-sm transition-all duration-200"
          >
            <div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg w-fit group-hover:bg-blue-100 transition-colors">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 mt-4 group-hover:text-theme-primary transition-colors text-sm">Compose Campaign</h3>
              <p className="text-xs text-slate-500 mt-1">Send personalized bulk messages to targeted constituent lists.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-primary mt-6 group-hover:translate-x-1 transition-transform">
              Send SMS <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link 
            href="/contacts" 
            className="group flex flex-col justify-between p-5 rounded-xl bg-white border border-slate-200/80 hover:border-theme-primary/30 hover:bg-slate-50/50 shadow-sm transition-all duration-200"
          >
            <div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg w-fit group-hover:bg-emerald-100 transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 mt-4 group-hover:text-theme-primary transition-colors text-sm">Add Constituents</h3>
              <p className="text-xs text-slate-500 mt-1">Register new contacts or import bulk datasets instantly via CSV.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-primary mt-6 group-hover:translate-x-1 transition-transform">
              Import Contacts <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link 
            href="/reminders" 
            className="group flex flex-col justify-between p-5 rounded-xl bg-white border border-slate-200/80 hover:border-theme-primary/30 hover:bg-slate-50/50 shadow-sm transition-all duration-200"
          >
            <div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg w-fit group-hover:bg-amber-100 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 mt-4 group-hover:text-theme-primary transition-colors text-sm">Schedule Reminders</h3>
              <p className="text-xs text-slate-500 mt-1">Set up automated SMS triggers for meetings, events, or updates.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-primary mt-6 group-hover:translate-x-1 transition-transform">
              Setup Scheduler <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link 
            href="/templates" 
            className="group flex flex-col justify-between p-5 rounded-xl bg-white border border-slate-200/80 hover:border-theme-primary/30 hover:bg-slate-50/50 shadow-sm transition-all duration-200"
          >
            <div>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg w-fit group-hover:bg-purple-100 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 mt-4 group-hover:text-theme-primary transition-colors text-sm">SMS Templates</h3>
              <p className="text-xs text-slate-500 mt-1">Draft reusable merge-tag scripts for recurring dispatches.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-theme-primary mt-6 group-hover:translate-x-1 transition-transform">
              View Templates <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Two-Column Analytics & Live Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Column 1: Recent Broadcast logs (Span 3 Columns) */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <BarChart3 className="w-5 h-5 text-slate-400" />
              Recent Outgoing Activity
            </h2>
            <Link 
              href="/reports" 
              className="text-xs font-semibold text-theme-primary hover:underline flex items-center gap-1.5"
            >
              See All Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            {stats.recentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                <Smartphone className="w-12 h-12 text-slate-300 stroke-[1.5] mb-3" />
                <p className="font-semibold text-slate-500">No outgoing activity logs found</p>
                <p className="text-xs text-slate-400 mt-0.5">Send a test message or launch an SMS campaign to populate your feed.</p>
              </div>
            ) : (
              stats.recentMessages.map((msg: any) => {
                const statusColors = 
                  msg.status === 'sent' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : msg.status === 'pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse'
                      : 'bg-red-50 text-red-700 border-red-100'

                return (
                  <div key={msg.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 bg-slate-50/50 rounded-xl border border-slate-100/80 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-900 font-bold">{msg.recipient}</span>
                        <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${statusColors}`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 max-w-md line-clamp-1 break-all">
                        {msg.content}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap self-end sm:self-center">
                      {formatTimeAgo(msg.sent_at)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Column 2: Constituent Demographics distribution (Span 2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5 mb-6">
              <Users className="w-5 h-5 text-slate-400" />
              Constituency Distribution
            </h2>
            
            <div className="space-y-6">
              {/* Distribution 1: Sub-Areas */}
              <div className="space-y-3.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Electoral Sub-Areas</h3>
                {stats.subAreaDistribution.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No sub-area fields populated in contacts.</p>
                ) : (
                  stats.subAreaDistribution.map((item) => {
                    const ratio = Math.round((item.count / (stats.totalContacts || 1)) * 100)
                    return (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 truncate max-w-[150px]">{item.name}</span>
                          <span className="text-slate-500">{item.count} ({ratio}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-theme-primary h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Distribution 2: Positions */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Leadership Positions</h3>
                {stats.positionDistribution.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No leadership positions defined in contacts.</p>
                ) : (
                  stats.positionDistribution.map((item) => {
                    const ratio = Math.round((item.count / (stats.totalContacts || 1)) * 100)
                    return (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 truncate max-w-[150px]">{item.name}</span>
                          <span className="text-slate-500">{item.count} ({ratio}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Demographic Density</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Target demographic segments instantly under the <Link href="/constituency" className="text-theme-primary font-bold hover:underline">Constituency Portal</Link>.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
