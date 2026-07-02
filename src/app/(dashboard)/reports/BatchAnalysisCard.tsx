'use client'

import { useState, useMemo } from 'react'
import { 
  Layers, ChevronDown, ChevronUp, CheckCircle2, XCircle, 
  Clock, TrendingUp, FileText, Search, ArrowUpDown, Filter
} from 'lucide-react'

interface BatchData {
  id: string
  timestamp: string
  content: string
  total: number
  sent: number
  failed: number
  pending: number
  successRate: number
}

type SortKey = 'timestamp' | 'total' | 'sent' | 'failed' | 'successRate'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'has_failures' | 'all_delivered' | 'has_pending'

export default function BatchAnalysisCard({ batches }: { batches: BatchData[] }) {
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredAndSorted = useMemo(() => {
    let result = [...(batches || [])]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(b =>
        b.content?.toLowerCase().includes(term) ||
        new Date(b.timestamp).toLocaleString('en-GB').toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter === 'has_failures') {
      result = result.filter(b => b.failed > 0)
    } else if (statusFilter === 'all_delivered') {
      result = result.filter(b => b.failed === 0 && b.pending === 0)
    } else if (statusFilter === 'has_pending') {
      result = result.filter(b => b.pending > 0)
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number, bVal: number
      if (sortKey === 'timestamp') {
        aVal = new Date(a.timestamp).getTime()
        bVal = new Date(b.timestamp).getTime()
      } else {
        aVal = a[sortKey]
        bVal = b[sortKey]
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [batches, searchTerm, sortKey, sortDir, statusFilter])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-8 text-center">
        <div className="p-3 bg-slate-50 rounded-full text-slate-400 inline-flex mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700">No campaign batches detected</p>
        <p className="text-xs text-slate-400 mt-1">Batches will appear here once messages are dispatched.</p>
      </div>
    )
  }

  const toggleBatch = (id: string) => {
    setExpandedBatchId(prev => prev === id ? null : id)
  }

  const getSuccessColor = (rate: number) => {
    if (rate >= 90) return 'text-emerald-600 bg-emerald-50'
    if (rate >= 70) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  const getBarColor = (rate: number) => {
    if (rate >= 90) return 'bg-emerald-500'
    if (rate >= 70) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const SortButton = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <button
      onClick={() => handleSort(sortField)}
      className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
        sortKey === sortField
          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
      }`}
    >
      {label}
      {sortKey === sortField && (
        <ArrowUpDown className="w-3 h-3" />
      )}
    </button>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Campaign Batch Analysis</h2>
            <p className="text-xs text-slate-500 font-medium">
              {batches.length} campaign batch{batches.length !== 1 ? 'es' : ''} detected
              {filteredAndSorted.length !== batches.length && (
                <span className="text-indigo-600 font-bold"> · Showing {filteredAndSorted.length}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Filters + Sorters */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search batch content..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8 w-full rounded-lg border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs py-2 px-3 bg-white text-slate-900"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-200 text-xs py-2 px-3 bg-white text-slate-700 font-semibold focus:border-indigo-500 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Batches</option>
            <option value="has_failures">Has Failures</option>
            <option value="all_delivered">All Delivered</option>
            <option value="has_pending">Has Pending</option>
          </select>
        </div>

        {/* Sort Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Sort:</span>
          <SortButton label="Date" sortField="timestamp" />
          <SortButton label="Total" sortField="total" />
          <SortButton label="Sent" sortField="sent" />
          <SortButton label="Failed" sortField="failed" />
          <SortButton label="Rate" sortField="successRate" />
        </div>
      </div>

      {/* Batch List */}
      {filteredAndSorted.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-slate-400 italic">No batches match your current filters.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredAndSorted.map((batch, idx) => {
            const isExpanded = expandedBatchId === batch.id
            const isSimulation = batch.content?.startsWith('[SIMULATION-DRYRUN]')
            const formattedDate = new Date(batch.timestamp).toLocaleString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={batch.id}>
                {/* Batch Row */}
                <button
                  onClick={() => toggleBatch(batch.id)}
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Batch</span>
                      <span className="text-lg font-black text-indigo-600">#{filteredAndSorted.length - idx}</span>
                    </div>

                    <div className="h-10 w-px bg-slate-200"></div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">{formattedDate}</span>
                        {isSimulation && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 uppercase">Simulation</span>
                        )}
                        {batch.failed > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-600">{batch.failed} failed</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-md font-medium">
                        {batch.content?.substring(0, 80)}...
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="font-bold text-emerald-600">{batch.sent}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="font-bold text-red-600">{batch.failed}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-slate-700">{batch.total}</span>
                      <span className="text-slate-400 font-medium">total</span>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-extrabold ${getSuccessColor(batch.successRate)}`}>
                      {batch.successRate}%
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Batch Details */}
                {isExpanded && (
                  <div className="px-6 pb-5 pt-1 bg-slate-50/40 border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">
                    {/* Stat Tiles */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                        <div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Dispatched</p>
                          <p className="text-lg font-black text-slate-900">{batch.total}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-50 rounded-md text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Delivered</p>
                          <p className="text-lg font-black text-emerald-600">{batch.sent}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                        <div className="p-1.5 bg-red-50 rounded-md text-red-600">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Failed</p>
                          <p className="text-lg font-black text-red-600">{batch.failed}</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                        <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
                          <p className="text-lg font-black text-amber-600">{batch.pending}</p>
                        </div>
                      </div>
                    </div>

                    {/* Success Rate Bar */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-700">Delivery Success Rate</span>
                        </div>
                        <span className={`text-sm font-extrabold ${batch.successRate >= 90 ? 'text-emerald-600' : batch.successRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                          {batch.successRate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getBarColor(batch.successRate)}`}
                          style={{ width: `${batch.successRate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] font-semibold text-slate-400">
                        <span>{batch.sent} delivered</span>
                        <span>{batch.failed} failed</span>
                      </div>
                    </div>

                    {/* Message Preview */}
                    <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Message Content</p>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-medium bg-slate-50 rounded-lg p-3 border border-slate-100">
                        {batch.content}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
