'use client'

import { useState, useEffect, useCallback } from 'react'
import { getLiveMessageQueueStats } from '@/app/(dashboard)/reports/actions'
import {
  Activity,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Gauge,
  Radio,
  ArrowUpRight,
  Smartphone,
  Zap,
  RefreshCw,
} from 'lucide-react'

interface QueueStats {
  counts: { pending: number; processing: number; sent: number; failed: number }
  activeMessages: Array<{
    id: string
    recipient: string
    content: string
    status: string
    sent_at: string
    sender_id: string | null
  }>
  recentCompleted: Array<{
    id: string
    recipient: string
    content: string
    status: string
    sent_at: string
    sender_id: string | null
  }>
}

function formatTimeAgo(dateString: string | null) {
  if (!dateString) return 'Pending'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)

  if (diffSec < 5) return 'Just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

export default function LiveMessageQueueMonitor() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [prevSentCount, setPrevSentCount] = useState(0)
  const [throughput, setThroughput] = useState(0)
  const [isPolling, setIsPolling] = useState(true)
  const [manualRefreshing, setManualRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const data = await getLiveMessageQueueStats()
      setStats((prev) => {
        // Calculate throughput based on difference in sent count
        if (prev) {
          const sentDiff = data.counts.sent - prev.counts.sent
          if (sentDiff > 0) {
            setThroughput(sentDiff)
          } else {
            setThroughput((t) => Math.max(0, t * 0.7)) // decay
          }
        }
        return data
      })
      setPrevSentCount(data.counts.sent)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Failed to fetch live queue stats:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch + polling
  useEffect(() => {
    fetchStats()
    const interval = setInterval(() => {
      if (isPolling) fetchStats()
    }, 3000)
    return () => clearInterval(interval)
  }, [fetchStats, isPolling])

  const handleManualRefresh = async () => {
    setManualRefreshing(true)
    await fetchStats()
    setManualRefreshing(false)
  }

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Message Queue Monitor</h2>
            <p className="text-xs text-slate-500">Loading live queue data...</p>
          </div>
        </div>
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      </div>
    )
  }

  const { counts, activeMessages, recentCompleted } = stats
  const totalAll = counts.pending + counts.processing + counts.sent + counts.failed
  const totalProcessed = counts.sent + counts.failed
  const completionPct = totalAll > 0 ? Math.round((totalProcessed / totalAll) * 100) : 100
  const isActive = counts.pending > 0 || counts.processing > 0

  // Determine system status
  const systemStatus = isActive
    ? counts.processing > 0
      ? 'DISPATCHING'
      : 'QUEUED'
    : totalAll > 0
      ? 'IDLE'
      : 'EMPTY'

  const statusConfig = {
    DISPATCHING: {
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      pulse: true,
      label: 'ACTIVELY DISPATCHING',
    },
    QUEUED: {
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      pulse: true,
      label: 'MESSAGES QUEUED',
    },
    IDLE: {
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
      pulse: false,
      label: 'ALL CLEAR',
    },
    EMPTY: {
      color: 'bg-slate-100 text-slate-500 border-slate-200',
      dot: 'bg-slate-400',
      pulse: false,
      label: 'NO MESSAGES',
    },
  }

  const status = statusConfig[systemStatus]

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
            <Activity className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Message Queue Monitor
              {isActive && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Live dispatch pipeline status — auto-refreshes every 3s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? 'animate-pulse' : ''}`} />
            {status.label}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={manualRefreshing}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            title="Manual refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${manualRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Pending */}
        <div className={`rounded-xl p-3.5 text-center transition-all duration-300 ${
          counts.pending > 0
            ? 'bg-amber-50/70 border border-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
            : 'bg-slate-50/50 border border-slate-100'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Clock className={`w-3.5 h-3.5 ${counts.pending > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${counts.pending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              Pending
            </span>
          </div>
          <span className={`text-2xl font-extrabold font-mono ${counts.pending > 0 ? 'text-amber-800' : 'text-slate-300'}`}>
            {counts.pending.toLocaleString()}
          </span>
        </div>

        {/* Processing */}
        <div className={`rounded-xl p-3.5 text-center transition-all duration-300 ${
          counts.processing > 0
            ? 'bg-indigo-50/70 border border-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.08)]'
            : 'bg-slate-50/50 border border-slate-100'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            {counts.processing > 0 ? (
              <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className={`text-[10px] font-bold uppercase tracking-wider ${counts.processing > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
              Processing
            </span>
          </div>
          <span className={`text-2xl font-extrabold font-mono ${counts.processing > 0 ? 'text-indigo-800' : 'text-slate-300'}`}>
            {counts.processing.toLocaleString()}
          </span>
        </div>

        {/* Sent / Delivered */}
        <div className={`rounded-xl p-3.5 text-center transition-all duration-300 ${
          counts.sent > 0
            ? 'bg-emerald-50/70 border border-emerald-200'
            : 'bg-slate-50/50 border border-slate-100'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <CheckCircle2 className={`w-3.5 h-3.5 ${counts.sent > 0 ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${counts.sent > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              Delivered
            </span>
          </div>
          <span className={`text-2xl font-extrabold font-mono ${counts.sent > 0 ? 'text-emerald-800' : 'text-slate-300'}`}>
            {counts.sent.toLocaleString()}
          </span>
        </div>

        {/* Failed */}
        <div className={`rounded-xl p-3.5 text-center transition-all duration-300 ${
          counts.failed > 0
            ? 'bg-rose-50/70 border border-rose-200'
            : 'bg-slate-50/50 border border-slate-100'
        }`}>
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${counts.failed > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${counts.failed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              Failed
            </span>
          </div>
          <span className={`text-2xl font-extrabold font-mono ${counts.failed > 0 ? 'text-rose-800' : 'text-slate-300'}`}>
            {counts.failed.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar & Throughput — only show when there are messages */}
      {totalAll > 0 && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* Progress Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                {isActive ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span className="text-xs">Queue draining...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-bold">All messages processed</span>
                  </>
                )}
              </span>
              <span className="font-mono text-xs font-bold text-slate-600">
                {completionPct}% ({totalProcessed.toLocaleString()}/{totalAll.toLocaleString()})
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 border border-slate-200/60 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r ${
                  isActive
                    ? 'from-indigo-500 via-blue-500 to-emerald-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                    : 'from-emerald-400 to-emerald-500'
                } transition-all duration-700 ease-out rounded-full`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          {/* Throughput & Metrics Mini-Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Throughput */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Gauge className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Throughput</span>
              </div>
              <div className="text-sm font-extrabold text-slate-800 font-mono flex items-baseline gap-1">
                <span>{throughput.toFixed(1)}</span>
                <span className="text-[9px] text-slate-400 font-normal">msg/3s</span>
              </div>
            </div>

            {/* Success Rate */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Zap className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Success Rate</span>
              </div>
              <div className="text-sm font-extrabold text-slate-800 font-mono flex items-baseline gap-1">
                <span>{totalProcessed > 0 ? Math.round((counts.sent / totalProcessed) * 100) : 100}</span>
                <span className="text-[9px] text-slate-400 font-normal">%</span>
              </div>
            </div>

            {/* Total Volume */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
              <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                <Send className="w-3 h-3 text-slate-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Volume</span>
              </div>
              <div className="text-sm font-extrabold text-slate-800 font-mono">
                {totalAll.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Activity Feed */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className={`w-3 h-3 ${isActive ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
            Live Activity Feed
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">
            Updated {formatTimeAgo(lastRefresh.toISOString())}
          </span>
        </div>

        {activeMessages.length === 0 && recentCompleted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
            <Smartphone className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-500">No active messages in the pipeline</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Messages will appear here when a campaign is dispatched.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {/* Active messages first */}
            {activeMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-300 ${
                  msg.status === 'processing'
                    ? 'bg-indigo-50/60 border border-indigo-100'
                    : 'bg-amber-50/50 border border-amber-100'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {msg.status === 'processing' ? (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin flex-shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-800">{msg.recipient}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        msg.status === 'processing'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                      {msg.content}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-mono flex-shrink-0 ml-2">
                  {formatTimeAgo(msg.sent_at)}
                </span>
              </div>
            ))}

            {/* Recently completed */}
            {recentCompleted.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-300 ${
                  msg.status === 'sent'
                    ? 'bg-emerald-50/40 border border-emerald-100/60'
                    : 'bg-rose-50/40 border border-rose-100/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {msg.status === 'sent' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-700">{msg.recipient}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        msg.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {msg.status === 'sent' ? 'delivered' : 'failed'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                      {msg.content}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 font-mono flex-shrink-0 ml-2">
                  {formatTimeAgo(msg.sent_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
