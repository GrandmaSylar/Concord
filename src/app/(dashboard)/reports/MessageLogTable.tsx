'use client'

import { useState, useTransition } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter,
  RotateCcw,
  Zap
} from 'lucide-react'
import { resendMessages } from './actions'
import { toast } from 'sonner'

interface MessageLog {
  id: string
  recipient: string
  content: string
  status: string
  sent_at: string
  sender_id: string | null
}

export default function MessageLogTable({ initialLogs }: { initialLogs: MessageLog[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Filter logs based on search and status safely
  const filteredLogs = (initialLogs || []).filter(log => {
    const recipient = log?.recipient || ''
    const content = log?.content || ''
    const matchesSearch = recipient.includes(searchTerm) || 
      content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || log?.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate pagination values
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const isAllSelected = filteredLogs.length > 0 && filteredLogs.every(log => selectedIds.has(log.id))

  const handleSelectAll = () => {
    const next = new Set(selectedIds)
    if (isAllSelected) {
      filteredLogs.forEach(log => next.delete(log.id))
    } else {
      filteredLogs.forEach(log => next.add(log.id))
    }
    setSelectedIds(next)
  }

  const handleSelectAllFailed = () => {
    const next = new Set(selectedIds)
    const failedLogs = filteredLogs.filter(log => log.status === 'failed')
    
    if (failedLogs.length === 0) {
      toast.error('No failed messages found in the current filtered list.')
      return
    }

    failedLogs.forEach(log => next.add(log.id))
    setSelectedIds(next)
    toast.success(`Selected all ${failedLogs.length} failed messages in view.`)
  }

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const handleResendSelected = () => {
    if (selectedIds.size === 0) return

    startTransition(async () => {
      const res = await resendMessages(Array.from(selectedIds))
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully re-queued ${res.count} messages for retry!`)
        setSelectedIds(new Set())
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col gap-4">
      {/* Header and Action Rows */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-slate-400" />
            Dispatch Audit Log
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Dispatches matching date parameters. Select entries to resend.</p>
        </div>

        {/* Selection Tools & Resend Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAllFailed}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer"
          >
            Select All Failed
          </button>
          
          {selectedIds.size > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleResendSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              Resend Selected ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Filter Options Row */}
      <div className="px-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search recipient or content..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-2 px-3 border bg-white text-slate-900"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any)
              setCurrentPage(1)
            }}
            className="rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-xs py-2 px-3 border bg-white text-slate-900"
          >
            <option value="all">All Dispatches</option>
            <option value="sent">Delivered Only</option>
            <option value="failed">Failed Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto relative min-h-[150px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Recipient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Message Content</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Sent At</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400 italic">
                  No dispatches matched your current filters.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => {
                const isSelected = selectedIds.has(log.id)
                return (
                  <tr 
                    key={log.id} 
                    onClick={() => handleToggleRow(log.id)}
                    className={`hover:bg-slate-50/75 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(log.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-slate-900">
                      {log.recipient}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="line-clamp-2 max-w-md whitespace-pre-wrap">{log.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {log.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-semibold border border-rose-100">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                      {log.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-100">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                      {new Date(log.sent_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{Math.min(filteredLogs.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
            <span className="font-bold text-slate-700">{Math.min(filteredLogs.length, currentPage * itemsPerPage)}</span> of{' '}
            <span className="font-bold text-slate-700">{filteredLogs.length}</span> dispatches
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-600 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
