'use client'

import { useState, useEffect, useRef } from 'react'
import { addReminder } from './actions'
import { getFilteredContacts, getAllFilteredContacts } from '../send/actions'
import { Clock, Search, ChevronLeft, ChevronRight, Filter, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import SystemConfirmDialog from '@/components/ui/SystemConfirmDialog'

type ContactInfo = { id: string, name: string, phone: string, position?: string, sub_area?: string, polling_station?: string }

const MERGE_TAGS = [
  { tag: '[Firstname]', label: 'First Name', description: 'Contact\'s first name' },
  { tag: '[Lastname]', label: 'Last Name', description: 'Contact\'s last name' },
  { tag: '[Fullname]', label: 'Full Name', description: 'Contact\'s full name' },
  { tag: '[Phone]', label: 'Phone', description: 'Contact\'s phone number' },
  { tag: '[Position]', label: 'Position', description: 'Contact\'s role (e.g. Chairman)' },
  { tag: '[SubArea]', label: 'Sub-Area', description: 'Contact\'s constituency sub-area' },
  { tag: '[Station]', label: 'Station', description: 'Contact\'s polling station' },
]

// Preview how a message would look for a sample contact
function previewMessage(template: string, contact?: ContactInfo): string {
  if (!contact) return template
  const nameParts = contact.name.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  return template
    .replace(/\[Firstname\]/gi, firstName)
    .replace(/\[Lastname\]/gi, lastName)
    .replace(/\[Fullname\]/gi, contact.name)
    .replace(/\[Phone\]/gi, contact.phone)
    .replace(/\[Position\]/gi, contact.position || '')
    .replace(/\[SubArea\]/gi, contact.sub_area || '')
    .replace(/\[Station\]/gi, contact.polling_station || '')
}

export default function AddReminderForm({ 
  filterOptions 
}: { 
  filterOptions: { groups: string[], sub_areas: string[], positions: string[] }
}) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedSenderId, setSelectedSenderId] = useState<'Rachael-RTK' | 'RachaelWG' | 'RTK4SERVICE'>('Rachael-RTK')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Contact Selection State
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [contacts, setContacts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loadingContacts, setLoadingContacts] = useState(true)

  // Filter State
  const [filterSubArea, setFilterSubArea] = useState('')
  const [filterPosition, setFilterPosition] = useState('')
  const [filterGroup, setFilterGroup] = useState('')
  
  // Store full contact info for merge tag personalization and scheduling
  const [selectedContacts, setSelectedContacts] = useState<Map<string, ContactInfo>>(new Map())

  useEffect(() => {
    async function loadContacts() {
      setLoadingContacts(true)
      const filters = {
        sub_area: filterSubArea || undefined,
        position: filterPosition || undefined,
        group_name: filterGroup || undefined
      }
      const res = await getFilteredContacts(page, search, sort, filters)
      setContacts(res.contacts)
      setTotal(res.total)
      setLoadingContacts(false)
    }
    
    const timer = setTimeout(() => {
      loadContacts()
    }, 300)

    return () => clearTimeout(timer)
  }, [page, search, sort, filterSubArea, filterPosition, filterGroup])

  // Toggle a single contact
  const toggleContact = (contact: ContactInfo) => {
    const next = new Map(selectedContacts)
    if (next.has(contact.id)) {
      next.delete(contact.id)
    } else {
      next.set(contact.id, contact)
    }
    setSelectedContacts(next)
  }

  // Select/deselect all on current page
  const toggleSelectPage = () => {
    const allSelected = contacts.every(c => selectedContacts.has(c.id))
    const next = new Map(selectedContacts)
    if (allSelected) {
      contacts.forEach(c => next.delete(c.id))
    } else {
      contacts.forEach(c => next.set(c.id, c))
    }
    setSelectedContacts(next)
  }

  // Select ALL contacts matching the current search (fetches from DB)
  const handleSelectAllMatching = async () => {
    setLoadingContacts(true)
    const filters = {
      sub_area: filterSubArea || undefined,
      position: filterPosition || undefined,
      group_name: filterGroup || undefined
    }
    const allContacts = await getAllFilteredContacts(search, filters)
    const next = new Map(selectedContacts)
    allContacts.forEach((c: ContactInfo) => next.set(c.id, c))
    setSelectedContacts(next)
    setLoadingContacts(false)
  }

  const handleClearSelection = () => {
    setSelectedContacts(new Map())
  }

  // Insert a merge tag at the current cursor position
  const insertMergeTag = (tag: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setMessage(prev => prev + tag)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMsg = message.substring(0, start) + tag + message.substring(end)
    setMessage(newMsg)
    // Restore cursor position after the inserted tag
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + tag.length
    }, 0)
  }

  const totalPages = Math.ceil(total / 50) || 1
  const isPageAllSelected = contacts.length > 0 && contacts.every(c => selectedContacts.has(c.id))
  const hasMergeTags = /\[(Firstname|Lastname|Fullname|Phone|Position|SubArea|Station)\]/i.test(message)

  // Get a sample contact for preview
  const sampleContact: ContactInfo | undefined = selectedContacts.size > 0 
    ? selectedContacts.values().next().value 
    : undefined
  const previewText = hasMergeTags && sampleContact 
    ? previewMessage(message, sampleContact) 
    : message

  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)
  const [pendingFormRef, setPendingFormRef] = useState<HTMLFormElement | null>(null)

  function handleInitialSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedContacts.size === 0) {
      toast.error('Please select at least one contact.')
      return
    }
    
    const formData = new FormData(event.currentTarget)
    const contactsArray = Array.from(selectedContacts.values())
    formData.append('recipients', JSON.stringify(contactsArray))
    
    setPendingFormData(formData)
    setPendingFormRef(event.currentTarget)
    setShowConfirm(true)
  }

  async function executeSubmit() {
    if (!pendingFormData || !pendingFormRef) return
    setLoading(true)

    const result = await addReminder(pendingFormData)

    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(`Successfully scheduled reminders for ${selectedContacts.size} recipients!`)
      setMessage('')
      setSelectedContacts(new Map())
      pendingFormRef.reset()
    }
    setLoading(false)
    setShowConfirm(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col gap-8">
      
      {/* 1. Recipient Selection Area */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
          <span>1. Select Recipients</span>
          <span className="text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {selectedContacts.size} Selected
          </span>
        </h2>

        {/* Enhanced Filters Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          {filterOptions.sub_areas.length > 0 && (
            <div className="relative group">
              <select
                value={filterSubArea}
                onChange={(e) => { setFilterSubArea(e.target.value); setPage(1); }}
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
                onChange={(e) => { setFilterPosition(e.target.value); setPage(1); }}
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
                onChange={(e) => { setFilterGroup(e.target.value); setPage(1); }}
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
              onClick={() => { setFilterSubArea(''); setFilterPosition(''); setFilterGroup(''); setPage(1); }}
              className="text-xs text-red-600 hover:underline flex items-center px-2 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Selection Actions */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <button 
            type="button" 
            onClick={handleSelectAllMatching}
            className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-all active:scale-95"
          >
            Select All Matching Contacts ({total})
          </button>
          {selectedContacts.size > 0 && (
            <button 
              type="button" 
              onClick={handleClearSelection}
              className="text-red-600 font-medium hover:text-red-700 hover:underline transition-all active:scale-95"
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Contacts Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden relative min-h-[300px]">
          {loadingContacts && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={isPageAllSelected}
                    onChange={toggleSelectPage}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.length === 0 && !loadingContacts ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleContact(contact)}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.id)}
                        onChange={() => {}}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{contact.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{contact.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {contact.group_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {contact.group_name}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {contacts.length > 0 ? (page - 1) * 50 + 1 : 0} to {Math.min(page * 50, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={page === totalPages || total === 0}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200"></div>

      {/* 2. Message Composition Area */}
      <div className={selectedContacts.size === 0 ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          2. Compose Message & Schedule
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <form onSubmit={handleInitialSubmit} className="space-y-5">
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
                    disabled={selectedContacts.size === 0}
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
                disabled={selectedContacts.size === 0}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
              />
            </div>

            {/* Merge Tag Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserPlus className="w-4 h-4 inline mr-1 -mt-0.5" />
                Insert Personalization Tag
              </label>
              <div className="flex flex-wrap gap-2">
                {MERGE_TAGS.map(({ tag, label }) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertMergeTag(tag)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                  >
                    + {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Click to insert at cursor position. Each recipient sees their own name.</p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message Content</label>
              <textarea
                ref={textareaRef}
                name="message"
                id="message"
                rows={5}
                required
                disabled={selectedContacts.size === 0}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white text-gray-900"
                placeholder={selectedContacts.size === 0 ? "Please select contacts first..." : "Type your message here... Use [Firstname] etc."}
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
              disabled={loading || selectedContacts.size === 0}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] items-center gap-2"
            >
              {loading ? 'Scheduling...' : <>Schedule Reminder <Clock className="w-4 h-4" /></>}
            </button>
          </form>

          {/* SMS Preview UI */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Live SMS Preview</h3>
            {hasMergeTags && sampleContact && (
              <p className="text-xs text-indigo-500 mb-3">
                Previewing as: <span className="font-semibold">{sampleContact.name}</span>
              </p>
            )}
            <div className="w-[280px] h-[500px] bg-white rounded-[3rem] border-[8px] border-slate-800 shadow-xl overflow-hidden relative flex flex-col">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-10"></div>
              
              {/* Phone Header */}
              <div className="bg-slate-100 h-20 border-b flex items-end justify-center pb-3 relative">
                <span className="font-semibold text-slate-800 text-sm tracking-wide transition-all duration-300">
                  {selectedSenderId}
                </span>
              </div>
              
              {/* Phone Body */}
              <div className="flex-1 bg-white p-4 flex flex-col justify-end gap-2 overflow-y-auto">
                <div className="bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-[15px] shadow-sm max-w-[85%] self-end break-words whitespace-pre-wrap">
                  {previewText || "Your message preview will appear here..."}
                </div>
                <span className="text-[10px] text-slate-400 self-end mr-1 font-medium">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SystemConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={executeSubmit}
        title="Confirm Bulk Reminder Schedule"
        description={
          <>
            You are about to schedule personalized reminders for <strong>{selectedContacts.size}</strong> contact{selectedContacts.size === 1 ? '' : 's'} using sender ID <strong>{selectedSenderId}</strong>. Are you sure you want to proceed?
          </>
        }
        confirmText="Yes, Schedule Reminders"
        type="warning"
        isLoading={loading}
      />
    </div>
  )
}
