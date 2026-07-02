'use client'

import { useState, useTransition } from 'react'
import { 
  XCircle, 
  RotateCcw, 
  RefreshCw, 
  Search, 
  AlertTriangle 
} from 'lucide-react'
import { resendMessages } from './actions'
import { toast } from 'sonner'

interface FailedMessageLog {
  id: string
  recipient: string
  content: string
  status: string
  sent_at: string
  sender_id: string | null
}

export default function FailedMessagesCard({ failedLogs }: { failedLogs: FailedMessageLog[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customMessage, setCustomMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  // Filter based on search input
  const filteredLogs = failedLogs.filter(log => 
    log.recipient.includes(searchTerm) || 
    log.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isAllSelected = filteredLogs.length > 0 && filteredLogs.every(log => selectedIds.has(log.id))

  const handleSelectAll = () => {
    const next = new Set(selectedIds)
    if (isAllSelected) {
      filteredLogs.forEach(log => next.delete(log.id))
      setCustomMessage('')
    } else {
      filteredLogs.forEach(log => next.add(log.id))
      if (filteredLogs.length > 0) {
        setCustomMessage(filteredLogs[0].content)
      }
    }
    setSelectedIds(next)
  }

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
      if (next.size === 0) {
        setCustomMessage('')
      }
    } else {
      next.add(id)
      if (next.size === 1) {
        const log = failedLogs.find(l => l.id === id)
        if (log) setCustomMessage(log.content)
      }
    }
    setSelectedIds(next)
  }

  const handleResendSelected = () => {
    if (selectedIds.size === 0) return

    startTransition(async () => {
      const res = await resendMessages(Array.from(selectedIds), customMessage || undefined)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Successfully re-queued ${res.count} failed messages for delivery retry!`)
        setSelectedIds(new Set())
        setCustomMessage('')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden flex flex-col gap-4">
      {/* Header Panel */}
      <div className="px-6 py-4 border-b border-red-50 bg-red-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100/50 text-red-700 rounded-lg mt-0.5">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-red-950 flex items-center gap-2">
              Failed Delivery Retry Console
            </h2>
            <p className="text-xs text-red-700/80 font-medium">Failed messages queue. Select entries to retry sending.</p>
          </div>
        </div>

        {/* Resend Actions */}
        {selectedIds.size > 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleResendSelected}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-750 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            Retry Selected Failed ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Search Input Filter & Custom Message Input */}
      {failedLogs.length > 0 && (
        <div className="px-6 flex flex-col gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search failed recipient or text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full rounded-lg border-slate-200 shadow-sm focus:border-red-500 focus:ring-red-500 text-xs py-2 px-3 border bg-white text-slate-900"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="p-4 rounded-xl bg-red-50/30 border border-red-100 flex flex-col gap-2.5 animate-in slide-in-from-top-1 duration-200">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-red-950">Edit SMS Message for Selected Recipients (Optional)</label>
                <span className="text-[10px] font-semibold text-slate-500">{customMessage.length} characters</span>
              </div>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 shadow-sm focus:border-red-500 focus:ring-red-500 text-xs py-2 px-3 bg-white text-slate-900 font-medium"
                placeholder="Type the message content to send..."
              />
              <p className="text-[10px] text-red-700/80 leading-normal">
                * Note: Modifying this text will apply the new message content to all selected recipients when resent. Leave as-is to retry the original content.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      <div className="overflow-x-auto relative min-h-[120px]">
        {failedLogs.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-sm font-bold text-slate-800">All caught up!</p>
            <p className="text-xs text-slate-500">There are no failed messages in the system logs to retry.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 italic">
            No failed messages matches your search criteria.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed Message Content</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sender ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 tracking-wider">Failed At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const isSelected = selectedIds.has(log.id)
                return (
                  <tr 
                    key={log.id}
                    onClick={() => handleToggleRow(log.id)}
                    className={`hover:bg-red-50/20 transition-colors cursor-pointer ${isSelected ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(log.id)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-red-700">
                      {log.recipient}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div className="line-clamp-2 max-w-md whitespace-pre-wrap">{log.content}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500">
                      {log.sender_id || 'Rachael-RTK'}
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
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
