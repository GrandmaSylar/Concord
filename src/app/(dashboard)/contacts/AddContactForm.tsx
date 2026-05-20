'use client'

import { useState } from 'react'
import { addContact } from './actions'
import { toast } from 'sonner'
import type { GroupOptions } from '../constituency/actions'
import SystemConfirmDialog from '@/components/ui/SystemConfirmDialog'

export default function AddContactForm({ groups }: { groups: GroupOptions }) {
  const [loading, setLoading] = useState(false)
  const [selectedStation, setSelectedStation] = useState('')
  const [selectedSubArea, setSelectedSubArea] = useState('')

  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [pendingFormRef, setPendingFormRef] = useState<HTMLFormElement | null>(null)

  function handleInitialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPendingFormData(new FormData(event.currentTarget))
    setPendingFormRef(event.currentTarget)
    setShowConfirm(true)
  }

  async function executeSubmit() {
    if (!pendingFormData || !pendingFormRef) return
    setLoading(true)

    // Automatically capture the polling station name if one is selected
    const station = groups.polling_stations.find(s => s.code === selectedStation)
    if (station) {
      pendingFormData.append('polling_station', station.name)
    }

    const result = await addContact(pendingFormData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Contact added successfully!')
      pendingFormRef.reset()
      setSelectedStation('')
      setSelectedSubArea('')
    }
    setLoading(false)
    setShowConfirm(false)
  }

  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    setSelectedStation(code)
    const station = groups.polling_stations.find(s => s.code === code)
    if (station && station.sub_area) {
      setSelectedSubArea(station.sub_area)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Contact</h2>
      
      <form onSubmit={handleInitialSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
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
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number <span className="text-red-500">*</span></label>
          <input
            type="tel"
            name="phone"
            id="phone"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            placeholder="0241234567"
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Constituency Allocations</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700">Leadership Role</label>
              <select
                name="position"
                id="position"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
              >
                <option value="">-- None --</option>
                {groups.positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="polling_station_code" className="block text-sm font-medium text-gray-700">Polling Station</label>
              <select
                name="polling_station_code"
                id="polling_station_code"
                value={selectedStation}
                onChange={handleStationChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
              >
                <option value="">-- None --</option>
                {groups.polling_stations.map(station => (
                  <option key={station.code} value={station.code}>
                    {station.name} ({station.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sub_area" className="block text-sm font-medium text-gray-700">Sub-Area</label>
              <select
                name="sub_area"
                id="sub_area"
                value={selectedSubArea}
                onChange={(e) => setSelectedSubArea(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
              >
                <option value="">-- None --</option>
                {groups.sub_areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">Custom Group (Optional)</label>
          <input
            type="text"
            name="group_name"
            id="groupName"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            placeholder="E.g. VIP, Campaign Team"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-theme-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
        >
          {loading ? 'Adding...' : 'Add Contact'}
        </button>
      </form>

      <SystemConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title="Add New Contact"
        description={`Are you sure you want to save this stakeholder into the system database?`}
        confirmText="Yes, Save Contact"
        type="success"
        isLoading={loading}
      />
    </div>
  )
}
