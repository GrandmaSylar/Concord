'use client'

import { useTransition } from 'react'
import { cancelReminder } from '../reminders/actions'
import { CalendarX2, Clock } from 'lucide-react'

export default function ScheduledQueue({ reminders }: { reminders: any[] }) {
  const [isPending, startTransition] = useTransition()

  const handleCancel = (id: string) => {
    if (confirm('Cancel this scheduled message?')) {
      startTransition(async () => {
        await cancelReminder(id)
      })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="font-medium text-gray-900">Upcoming Messages</h3>
      </div>
      
      {reminders.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Queue is empty.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {reminders.map(r => (
            <li key={r.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    r.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    r.status === 'sent' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {r.status.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{r.contacts?.name || 'Unknown'}</span>
                  <span className="text-sm text-gray-500">({r.contacts?.phone || 'Unknown'})</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{r.message}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right text-xs text-gray-500 flex flex-col items-end">
                  <span className="flex items-center gap-1 font-medium text-gray-700" suppressHydrationWarning>
                    <Clock className="w-3 h-3" />
                    {new Date(r.trigger_time).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={isPending}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Cancel scheduled message"
                  >
                    <CalendarX2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
