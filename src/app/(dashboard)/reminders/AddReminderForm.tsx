'use client'

import { useState } from 'react'
import { addReminder } from './actions'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function AddReminderForm({ contacts }: { contacts: {id: string, name: string}[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedSenderId, setSelectedSenderId] = useState<'Rachael-RTK' | 'RachaelWG' | 'RTK4SERVICE'>('Rachael-RTK')
  const [message, setMessage] = useState('')
  const [selectedContactId, setSelectedContactId] = useState('')

  const selectedContact = contacts.find(c => c.id === selectedContactId)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const result = await addReminder(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Reminder scheduled successfully!')
      setMessage('')
      setSelectedContactId('')
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
        <Clock className="w-5 h-5 text-gray-500" />
        Schedule Reminder
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">Select Contact</label>
            <select
              name="contact_id"
              id="contact_id"
              required
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 border bg-white text-gray-900"
            >
              <option value="">-- Choose Contact --</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sender ID Cards Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sender ID
            </label>
            <input type="hidden" name="senderId" value={selectedSenderId} />
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'Rachael-RTK', badge: 'Official', desc: 'Primary branding' },
                { id: 'RachaelWG', badge: 'Campaign', desc: 'Alternate route' },
                { id: 'RTK4SERVICE', badge: 'Service', desc: 'Utility alerts' }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSenderId(s.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer select-none active:scale-[0.98] ${
                    selectedSenderId === s.id
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-sm font-semibold'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 font-normal'
                  }`}
                >
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full mb-1 ${
                    selectedSenderId === s.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {s.badge}
                  </span>
                  <span className="text-xs font-bold text-gray-900 tracking-tight leading-none mb-1">
                    {s.id}
                  </span>
                  <span className="text-[9px] text-gray-400 font-medium leading-tight">
                    {s.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="trigger_time" className="block text-sm font-medium text-gray-700">Send At</label>
            <input
              type="datetime-local"
              name="trigger_time"
              id="trigger_time"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 border bg-white text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message Content</label>
            <textarea
              name="message"
              id="message"
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
              placeholder="Type reminder message..."
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Standard SMS: 160 characters per part.</span>
              <span className={message.length > 160 ? "text-amber-600 font-medium" : ""}>
                {message.length} chars ({Math.ceil((message.length || 1) / 160)} SMS)
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] items-center gap-2"
          >
            {loading ? 'Scheduling...' : 'Schedule Reminder'}
          </button>
        </form>

        {/* Live SMS Preview Mockup Column */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[400px]">
          <h3 className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Live SMS Preview</h3>
          {selectedContact && (
            <p className="text-xs text-indigo-500 mb-3">
              Previewing for: <span className="font-semibold">{selectedContact.name}</span>
            </p>
          )}
          <div className="w-[280px] h-[460px] bg-white rounded-[3rem] border-[8px] border-slate-800 shadow-xl overflow-hidden relative flex flex-col">
            <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 rounded-b-xl w-32 mx-auto z-10"></div>
            
            {/* Phone Header */}
            <div className="bg-slate-100 h-16 border-b flex items-end justify-center pb-2.5 relative">
              <span className="font-semibold text-slate-800 text-xs tracking-wide transition-all duration-300">
                {selectedSenderId}
              </span>
            </div>
            
            {/* Phone Body */}
            <div className="flex-1 bg-white p-4 flex flex-col justify-end gap-2 overflow-y-auto">
              <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-[13px] shadow-sm max-w-[85%] self-end break-words whitespace-pre-wrap">
                {message || "Your reminder message preview will appear here..."}
              </div>
              <span className="text-[9px] text-slate-400 self-end mr-1 font-medium">Just now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
