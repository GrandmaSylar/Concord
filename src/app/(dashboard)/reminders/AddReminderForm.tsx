'use client'

import { useState } from 'react'
import { addReminder } from './actions'
import { Clock } from 'lucide-react'

export default function AddReminderForm({ contacts }: { contacts: {id: string, name: string}[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const form = event.currentTarget
    const formData = new FormData(form)
    const result = await addReminder(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess('Reminder scheduled successfully!')
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gray-500" />
        Schedule Reminder
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700">Select Contact</label>
          <select
            name="contact_id"
            id="contact_id"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
          >
            <option value="">-- Choose Contact --</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="trigger_time" className="block text-sm font-medium text-gray-700">Send At</label>
          <input
            type="datetime-local"
            name="trigger_time"
            id="trigger_time"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message Content</label>
          <textarea
            name="message"
            id="message"
            rows={4}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            placeholder="Type reminder message..."
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Scheduling...' : 'Schedule Reminder'}
        </button>
      </form>
    </div>
  )
}
