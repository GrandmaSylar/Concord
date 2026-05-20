'use client'

import { useState, useTransition } from 'react'
import { Search, Power, Pencil } from 'lucide-react'
import { toggleOptOut } from './actions'
import EditContactDialog from './EditContactDialog'

interface Contact {
  id: string
  name: string
  phone: string
  group_name: string
  position?: string
  sub_area?: string
  polling_station_code?: string
  opt_out: boolean
  created_at: string
}

export default function ContactList({ 
  initialContacts,
  filterOptions
}: { 
  initialContacts: Contact[]
  filterOptions: { groups: string[], sub_areas: string[], positions: string[] }
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  const [filterSubArea, setFilterSubArea] = useState('')
  const [filterPosition, setFilterPosition] = useState('')
  const [isPending, startTransition] = useTransition()
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  const filteredContacts = initialContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contact.phone.includes(searchTerm)
    const matchesGroup = !filterGroup || contact.group_name === filterGroup
    const matchesSubArea = !filterSubArea || contact.sub_area === filterSubArea
    const matchesPosition = !filterPosition || contact.position === filterPosition
    
    return matchesSearch && matchesGroup && matchesSubArea && matchesPosition
  })

  const handleToggleOptOut = (id: string, status: boolean) => {
    startTransition(async () => {
      await toggleOptOut(id, status)
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50 rounded-t-lg">
        {/* Enhanced Filters Row */}
        <div className="flex flex-wrap gap-3">
          {filterOptions.sub_areas.length > 0 && (
            <div className="relative group">
              <select
                value={filterSubArea}
                onChange={(e) => setFilterSubArea(e.target.value)}
                className="appearance-none bg-white border border-blue-500 text-blue-700 hover:bg-blue-50 transition-colors pl-3 pr-8 py-1.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
              >
                <option value="">Constituency: All</option>
                {filterOptions.sub_areas.map(area => (
                  <option key={area} value={area}>Constituency: {area}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          )}

          {filterOptions.positions.length > 0 && (
            <div className="relative group">
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="appearance-none bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors pl-3 pr-8 py-1.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
              >
                <option value="">Position: All</option>
                {filterOptions.positions.map(pos => (
                  <option key={pos} value={pos}>Position: {pos}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          )}

          {filterOptions.groups.length > 0 && (
            <div className="relative group">
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="appearance-none bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors pl-3 pr-8 py-1.5 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm cursor-pointer"
              >
                <option value="">Group: All</option>
                {filterOptions.groups.map(g => (
                  <option key={g} value={g}>Group: {g}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          )}
          
          {(filterSubArea || filterPosition || filterGroup) && (
            <button 
              onClick={() => { setFilterSubArea(''); setFilterPosition(''); setFilterGroup(''); }}
              className="text-xs text-red-600 hover:underline flex items-center px-2 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-xs ${contact.opt_out ? 'text-gray-400' : 'text-gray-500'}`}>{contact.phone}</p>
                    {contact.sub_area && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {contact.sub_area}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
                      {contact.group_name || 'Ungrouped'}
                    </span>
                    {contact.position && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {contact.position}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingContact(contact)}
                      title="Edit Contact"
                      className="p-1.5 rounded-full transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleOptOut(contact.id, contact.opt_out)}
                      disabled={isPending}
                      title={contact.opt_out ? "Opt-in Contact" : "Opt-out Contact"}
                      className={`p-1.5 rounded-full transition-colors ${contact.opt_out ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <EditContactDialog
        contact={editingContact}
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
      />
    </div>
  )
}
