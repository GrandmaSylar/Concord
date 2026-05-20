'use client'

import { useState } from 'react'
import { updateContact, deleteContact } from './actions'
import { toast } from 'sonner'
import { X, Save, Trash2 } from 'lucide-react'
import SystemConfirmDialog from '@/components/ui/SystemConfirmDialog'

interface Contact {
  id: string
  name: string
  phone: string
  group_name: string
  position?: string
  sub_area?: string
  polling_station_code?: string
  polling_station?: string
  opt_out: boolean
  created_at: string
}

export default function EditContactDialog({ 
  contact, 
  isOpen, 
  onClose 
}: { 
  contact: Contact | null
  isOpen: boolean
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!isOpen || !contact) return null

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contact) return
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const result = await updateContact(contact.id, formData)
    
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Contact updated successfully')
      onClose()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!contact) return
    setLoading(true)
    const result = await deleteContact(contact.id)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Contact deleted successfully')
      onClose()
    }
    setLoading(false)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/75 backdrop-blur-sm transition-opacity">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Edit Contact</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleUpdate} className="p-6 overflow-y-auto flex-1 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" id="name" required defaultValue={contact.name} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone <span className="text-red-500">*</span></label>
              <input type="text" name="phone" id="phone" required defaultValue={contact.phone} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900" />
            </div>

            <div>
              <label htmlFor="group_name" className="block text-sm font-medium text-gray-700">Group Name</label>
              <input type="text" name="group_name" id="group_name" defaultValue={contact.group_name} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sub_area" className="block text-sm font-medium text-gray-700">Constituency</label>
                <input type="text" name="sub_area" id="sub_area" defaultValue={contact.sub_area} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900" />
              </div>
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">Role/Position</label>
                <input type="text" name="position" id="position" defaultValue={contact.position} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="polling_station" className="block text-sm font-medium text-gray-700">Polling Station</label>
                <input type="text" name="polling_station" id="polling_station" defaultValue={contact.polling_station} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900" />
              </div>
              <div>
                <label htmlFor="polling_station_code" className="block text-sm font-medium text-gray-700">Station Code</label>
                <input type="text" name="polling_station_code" id="polling_station_code" defaultValue={contact.polling_station_code} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900" />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 mt-6 flex justify-between items-center gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <>Save Changes <Save className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <SystemConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Contact?"
        description={<>Are you sure you want to delete <strong>{contact.name}</strong>? This action cannot be undone.</>}
        confirmText="Yes, Delete Contact"
        type="danger"
        isLoading={loading}
      />
    </>
  )
}
