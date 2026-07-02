import { getMessageLogs, getSMSAnalytics, getFailedMessageLogs, getAnomalyContacts } from './actions'
import { 
 CheckCircle2, XCircle, Clock, BarChart3, TrendingUp, 
 Zap, DollarSign, Wifi, AlertTriangle, Send 
} from 'lucide-react'
import MessageLogTable from './MessageLogTable'
import FailedMessagesCard from './FailedMessagesCard'
import AnomalyContactsCard from './AnomalyContactsCard'
import DateFilter from './DateFilter'

// Carrier brand colors
const CARRIER_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
 'MTN': { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-400' },
 'Telecel': { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-400' },
 'AirtelTigo':{ bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-400' },
 'Other': { bg: 'bg-slate-50', text: 'text-slate-600', bar: 'bg-slate-400' },
}

interface ReportsPageProps {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
 const params = await searchParams
 const startDate = params.startDate
 const endDate = params.endDate

 const [logs, analytics, failedLogs, anomalies] = await Promise.all([
 getMessageLogs(startDate, endDate),
 getSMSAnalytics(startDate, endDate),
 getFailedMessageLogs(startDate, endDate),
 getAnomalyContacts(),
 ])

 const { summary, carrierData, timelineData } = analytics
 const maxDailyVolume = Math.max(...timelineData.map(d => d.sent + d.failed), 1)

 return (
 <div className="flex flex-col gap-8 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold tracking-tight text-gray-900">SMS Analytics & Delivery Reports</h1>
 <p className="text-sm text-gray-500 mt-1">Comprehensive gateway performance metrics, carrier distribution analysis, and delivery audit logs.</p>
 </div>
 </div>

 {/* Date Parameter Filter Tool */}
 <DateFilter />

 {/* ── Summary Stat Cards ── */}
 <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:-translate-y-0.5 transition-all">
 <div className="flex items-center gap-2 mb-3">
 <div className="p-2 bg-indigo-50 rounded-lg"><Send className="w-4 h-4 text-indigo-600" /></div>
 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Dispatches</span>
 </div>
 <p className="text-2xl font-extrabold text-slate-900">{summary.total.toLocaleString()}</p>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:-translate-y-0.5 transition-all">
 <div className="flex items-center gap-2 mb-3">
 <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered</span>
 </div>
 <p className="text-2xl font-extrabold text-emerald-700">{summary.sent.toLocaleString()}</p>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:-translate-y-0.5 transition-all">
 <div className="flex items-center gap-2 mb-3">
 <div className="p-2 bg-rose-50 rounded-lg"><XCircle className="w-4 h-4 text-rose-600" /></div>
 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed</span>
 </div>
 <p className="text-2xl font-extrabold text-rose-700">{summary.failed.toLocaleString()}</p>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:-translate-y-0.5 transition-all">
 <div className="flex items-center gap-2 mb-3">
 <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp className="w-4 h-4 text-purple-600" /></div>
 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</span>
 </div>
 <p className="text-2xl font-extrabold text-slate-900">{summary.successRate}%</p>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 hover:-translate-y-0.5 transition-all">
 <div className="flex items-center gap-2 mb-3">
 <div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="w-4 h-4 text-amber-600" /></div>
 <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Cost</span>
 </div>
 <p className="text-2xl font-extrabold text-slate-900">GH₵{summary.estimatedCost}</p>
 <p className="text-[10px] text-slate-400 mt-0.5">{summary.totalSmsParts} SMS parts</p>
 </div>
 </div>

 {/* ── Two-Column: Carrier Breakdown + Volume Timeline ── */}
 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

 {/* Carrier Network Breakdown */}
 <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
 <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
 <Wifi className="w-4 h-4 text-slate-400" />
 Carrier Network Distribution
 </h2>
 {carrierData.length === 0 ? (
 <p className="text-sm text-slate-400 italic">No message data available yet.</p>
 ) : (
 <div className="space-y-4">
 {carrierData.map(carrier => {
 const pct = summary.total > 0 ? Math.round((carrier.total / summary.total) * 100) : 0
 const colors = CARRIER_COLORS[carrier.name] || CARRIER_COLORS['Other']
 const deliveryRate = carrier.total > 0 ? Math.round((carrier.sent / carrier.total) * 100) : 0
 return (
 <div key={carrier.name} className="space-y-2">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
 {carrier.name}
 </span>
 <span className="text-xs text-slate-500">{carrier.total.toLocaleString()} messages</span>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-[10px] text-emerald-600 font-semibold">{deliveryRate}% delivered</span>
 <span className="text-xs font-bold text-slate-700">{pct}%</span>
 </div>
 </div>
 <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
 style={{ width: `${pct}%` }}
 />
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>

 {/* Daily Volume Timeline */}
 <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
 <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-5">
 <BarChart3 className="w-4 h-4 text-slate-400" />
 Daily Send Volume (Last 30 Days)
 </h2>
 <div className="flex items-end gap-[3px] h-40">
 {timelineData.map((day, i) => {
 const sentH = maxDailyVolume > 0 ? (day.sent / maxDailyVolume) * 100 : 0
 const failedH = maxDailyVolume > 0 ? (day.failed / maxDailyVolume) * 100 : 0
 const totalDay = day.sent + day.failed
 return (
 <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
 {/* Tooltip */}
 <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
 <div className="bg-slate-900 text-white text-[9px] font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap">
 {day.label}: {totalDay} SMS
 </div>
 <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
 </div>
 {/* Bars */}
 <div className="w-full flex flex-col justify-end" style={{ height: `${sentH + failedH}%`, minHeight: totalDay > 0 ? '2px' : '0' }}>
 {day.failed > 0 && (
 <div
 className="w-full bg-rose-300 rounded-t-sm"
 style={{ height: `${failedH > 0 ? Math.max((failedH / (sentH + failedH)) * 100, 8) : 0}%`, minHeight: '1px' }}
 />
 )}
 {day.sent > 0 && (
 <div
 className="w-full bg-emerald-400 rounded-t-sm"
 style={{ height: `${sentH > 0 ? Math.max((sentH / (sentH + failedH)) * 100, 8) : 0}%`, minHeight: '1px' }}
 />
 )}
 </div>
 {/* X-axis label (every 5th day) */}
 {i % 5 === 0 && (
 <span className="text-[8px] text-slate-400 mt-1.5 font-medium">{day.label}</span>
 )}
 </div>
 )
 })}
 </div>
 <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
 <span className="text-[10px] text-slate-500 font-medium">Delivered</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-sm bg-rose-300" />
 <span className="text-[10px] text-slate-500 font-medium">Failed</span>
 </div>
 </div>
 </div>
 </div>

 {/* ── Failed Messages Card ── */}
 <FailedMessagesCard failedLogs={failedLogs} />

 {/* ── Phone Number Anomaly Card ── */}
 <AnomalyContactsCard anomalies={anomalies} />

 {/* ── Message Log Table ── */}
 <MessageLogTable initialLogs={logs} />
 </div>
 )
}
