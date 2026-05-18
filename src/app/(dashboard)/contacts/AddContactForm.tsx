'use client'

import { useState } from 'react'
import { addContact } from './actions'
import { toast } from 'sonner'

export default function AddContactForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    const result = await addContact(formData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Contact added successfully!')
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Contact</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            name="phone"
            id="phone"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            placeholder="0241234567"
          />
        </div>

        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Group Name (Optional)</label>
          <input
            type="text"
            name="group_name"
            id="groupName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            placeholder="Customers"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
        >
          {loading ? 'Adding...' : 'Add Contact'}
        </button>
      </form>
    </div>
  )
}
