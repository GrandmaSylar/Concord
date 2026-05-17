'use client'

import { useState, useTransition } from 'react'
import { Search, Power } from 'lucide-react'
import { toggleOptOut } from './actions'

interface Contact {
  id: string
  name: string
  phone: string
  group_name: string
  opt_out: boolean
  created_at: string
}

export default function ContactList({ initialContacts }: { initialContacts: Contact[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('All')
  const [isPending, startTransition] = useTransition()

  // Derive unique groups
  const groups = ['All', ...Array.from(new Set(initialContacts.map(c => c.group_name).filter(Boolean)))]

  const filteredContacts = initialContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contact.phone.includes(searchTerm)
    const matchesGroup = filterGroup === 'All' || contact.group_name === filterGroup
    return matchesSearch && matchesGroup
  })

  const handleToggleOptOut = (id: string, status: boolean) => {
    startTransition(async () => {
      await toggleOptOut(id, status)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50 rounded-t-lg">
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div className="w-full sm:w-48">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
          >
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No contacts found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredContacts.map(contact => (
              <li key={contact.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${contact.opt_out ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{contact.name}</p>
                  <p className={`text-sm ${contact.opt_out ? 'text-gray-400' : 'text-gray-500'}`}>{contact.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {contact.group_name || 'Ungrouped'}
                  </span>
                  <button
                    onClick={() => handleToggleOptOut(contact.id, contact.opt_out)}
                    disabled={isPending}
                    title={contact.opt_out ? "Opt-in Contact" : "Opt-out Contact"}
                    className={`p-1.5 rounded-full transition-colors ${contact.opt_out ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
