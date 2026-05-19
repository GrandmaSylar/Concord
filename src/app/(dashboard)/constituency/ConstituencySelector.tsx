'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Users, Phone, MapPin, ChevronLeft, ChevronRight, Send, Filter, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import {
  getConstituencyContacts,
  getAllConstituencyContacts,
  getConstituencyStats,
  type ConstituencyContact,
  type FilterParams,
  type GroupOptions,
  type ContactStats,
} from './actions'

const TABS = ['All Members', 'By Sub-Area', 'By Position', 'By Station', 'Smart Filters'] as const
type TabKey = typeof TABS[number]

const SMART_FILTERS = [
  { label: 'Missing Contact', key: 'missing_contact' },
  { label: 'Missing Voter ID', key: 'missing_voter_id' },
  { label: 'Chairmen Only', key: 'chairmen' },
] as const

interface Props {
  initialContacts: ConstituencyContact[]
  initialTotal: number
  groups: GroupOptions
  initialStats: ContactStats
}

export default function ConstituencySelector({ initialContacts, initialTotal, groups, initialStats }: Props) {
  const [contacts, setContacts] = useState(initialContacts)
  const [total, setTotal] = useState(initialTotal)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('All Members')
  const [excludeNoPhone, setExcludeNoPhone] = useState(false)

  // Active filters
  const [filters, setFilters] = useState<FilterParams>({})
  const [selected, setSelected] = useState<Map<string, ConstituencyContact>>(new Map())

  const pageSize = 50
  const totalPages = Math.ceil(total / pageSize) || 1

  // Build effective filters from state
  const buildFilters = useCallback((): FilterParams => {
    const f: FilterParams = { page, pageSize, search: search || undefined }
    if (filters.sub_area) f.sub_area = filters.sub_area
    if (filters.position) f.position = filters.position
    if (filters.polling_station_code) f.polling_station_code = filters.polling_station_code
    if (filters.has_contact !== undefined) f.has_contact = filters.has_contact
    if (filters.has_voter_id !== undefined) f.has_voter_id = filters.has_voter_id
    if (excludeNoPhone) f.has_contact = true
    return f
  }, [page, search, filters, excludeNoPhone])

  // Fetch contacts when filters change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      const f = buildFilters()
      const [data, newStats] = await Promise.all([
        getConstituencyContacts(f),
        getConstituencyStats(f),
      ])
      setContacts(data.contacts)
      setTotal(data.total)
      setStats(newStats)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [page, search, filters, excludeNoPhone, buildFilters])

  // Filter handlers
  const applyFilter = (key: keyof FilterParams, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const removeFilter = (key: keyof FilterParams) => {
    setFilters(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPage(1)
  }

  const clearAllFilters = () => {
    setFilters({})
    setSearch('')
    setActiveTab('All Members')
    setPage(1)
  }

  const applySmartFilter = (key: string) => {
    switch (key) {
      case 'missing_contact':
        setFilters({ has_contact: false }); break
      case 'missing_voter_id':
        setFilters({ has_voter_id: false }); break
      case 'chairmen':
        setFilters({ position: 'Chairman' }); break
    }
    setPage(1)
  }

  // Selection
  const toggleContact = (c: ConstituencyContact) => {
    const next = new Map(selected)
    if (next.has(c.id)) { next.delete(c.id) } else { next.set(c.id, c) }
    setSelected(next)
  }

  const toggleSelectPage = () => {
    const allSelected = contacts.every(c => selected.has(c.id))
    const next = new Map(selected)
    contacts.forEach(c => allSelected ? next.delete(c.id) : next.set(c.id, c))
    setSelected(next)
  }

  const selectAllMatching = async () => {
    setLoading(true)
    const all = await getAllConstituencyContacts(buildFilters())
    const next = new Map(selected)
    all.forEach((c: Pick<ConstituencyContact, 'id' | 'name' | 'phone' | 'position' | 'sub_area' | 'polling_station' | 'has_contact'>) => next.set(c.id, c as ConstituencyContact))
    setSelected(next)
    setLoading(false)
    toast.success(`Selected ${all.length} contacts`)
  }

  // Get selected contacts ready for SMS
  const getSelectedForSMS = () => {
    return Array.from(selected.values())
      .filter(c => c.has_contact && c.phone)
      .map(c => ({ name: c.name, phone: c.phone!, position: c.position, sub_area: c.sub_area }))
  }

  const smsReady = getSelectedForSMS()
  const isPageAllSelected = contacts.length > 0 && contacts.every(c => selected.has(c.id))

  // Active filter chips
  const activeChips: { label: string; key: keyof FilterParams }[] = []
  if (filters.sub_area) activeChips.push({ label: `Sub-Area: ${filters.sub_area}`, key: 'sub_area' })
  if (filters.position) activeChips.push({ label: `Position: ${filters.position}`, key: 'position' })
  if (filters.polling_station_code) activeChips.push({ label: `Station: ${filters.polling_station_code}`, key: 'polling_station_code' })
  if (filters.has_contact === true) activeChips.push({ label: 'Has Contact', key: 'has_contact' })
  if (filters.has_contact === false) activeChips.push({ label: 'Missing Contact', key: 'has_contact' })
  if (filters.has_voter_id === false) activeChips.push({ label: 'Missing Voter ID', key: 'has_voter_id' })

  return (
    <div className="flex flex-col gap-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users, color: 'blue' },
          { label: 'With Contact', value: stats.with_contact, icon: Phone, color: 'emerald' },
          { label: 'No Contact', value: stats.without_contact, icon: AlertTriangle, color: 'amber' },
          { label: 'Sub-Areas', value: stats.sub_area_count, icon: MapPin, color: 'purple' },
          { label: 'Stations', value: stats.station_count, icon: MapPin, color: 'slate' },
          { label: 'Selected', value: selected.size, icon: Users, color: 'indigo' },
          { label: 'SMS Ready', value: smsReady.length, icon: Send, color: 'green' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-lg border border-gray-200 p-3 flex items-center gap-2`}>
            <div className={`p-1.5 rounded bg-${s.color}-50`}>
              <s.icon className={`w-4 h-4 text-${s.color}-600`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'All Members') clearAllFilters() }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content: Contextual Selectors */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          {activeTab === 'By Sub-Area' && (
            <div className="flex flex-wrap gap-2">
              {groups.sub_areas.map(area => (
                <button key={area} onClick={() => applyFilter('sub_area', area)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filters.sub_area === area
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >{area}</button>
              ))}
            </div>
          )}
          {activeTab === 'By Position' && (
            <div className="flex flex-wrap gap-2">
              {groups.positions.map(pos => (
                <button key={pos} onClick={() => applyFilter('position', pos)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    filters.position === pos
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >{pos}</button>
              ))}
            </div>
          )}
          {activeTab === 'By Station' && (
            <select
              value={filters.polling_station_code || ''}
              onChange={e => e.target.value ? applyFilter('polling_station_code', e.target.value) : removeFilter('polling_station_code')}
              className="w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border bg-white"
            >
              <option value="">Select a polling station...</option>
              {groups.polling_stations.map(s => (
                <option key={s.code} value={s.code}>{s.name} ({s.code}) — {s.sub_area}</option>
              ))}
            </select>
          )}
          {activeTab === 'Smart Filters' && (
            <div className="flex flex-wrap gap-2">
              {SMART_FILTERS.map(sf => (
                <button key={sf.key} onClick={() => applySmartFilter(sf.key)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-amber-50 hover:border-amber-300 transition-all"
                >{sf.label}</button>
              ))}
            </div>
          )}
          {activeTab === 'All Members' && (
            <p className="text-sm text-gray-500">Showing all constituency contacts. Use tabs above to filter.</p>
          )}

          {/* Cross-filter: if sub_area is set, show position filter too */}
          {filters.sub_area && activeTab === 'By Sub-Area' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Further filter by position:</p>
              <div className="flex flex-wrap gap-2">
                {groups.positions.map(pos => (
                  <button key={pos} onClick={() => applyFilter('position', pos)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      filters.position === pos ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-indigo-50'
                    }`}
                  >{pos}</button>
                ))}
                {filters.position && (
                  <button onClick={() => removeFilter('position')} className="px-2.5 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50">Clear</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search + Controls */}
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search name, station, sub-area..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border bg-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={excludeNoPhone} onChange={e => setExcludeNoPhone(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            Exclude contacts without phone
          </label>
        </div>

        {/* Filter Chips */}
        {activeChips.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {activeChips.map(chip => (
              <span key={chip.key} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {chip.label}
                <button onClick={() => removeFilter(chip.key)} className="hover:text-blue-600"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <button onClick={clearAllFilters} className="text-xs text-red-600 hover:underline">Clear all</button>
          </div>
        )}

        {/* Selection Actions */}
        <div className="px-4 pb-2 flex flex-wrap gap-3 text-sm">
          <button type="button" onClick={selectAllMatching} className="text-blue-600 font-medium hover:underline">
            Select All Matching ({total})
          </button>
          {selected.size > 0 && (
            <button type="button" onClick={() => setSelected(new Map())} className="text-red-600 font-medium hover:underline">
              Clear Selection
            </button>
          )}
        </div>

        {/* Contacts Table */}
        <div className="relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-12">
                  <input type="checkbox" checked={isPageAllSelected} onChange={toggleSelectPage}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Sub-Area</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Station</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">No contacts found.</td>
                </tr>
              ) : (
                contacts.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => toggleContact(c)}
                    className={`cursor-pointer transition-colors ${
                      !c.has_contact ? 'border-l-4 border-l-amber-400 bg-amber-50/30' : 'hover:bg-gray-50'
                    } ${selected.has(c.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => {}}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{c.position || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{c.sub_area}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{c.polling_station || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.phone || '—'}</td>
                    <td className="px-4 py-3">
                      {c.has_contact ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">✓</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" /> No Contact
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
        <div className="p-4 flex items-center justify-between border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {total > 0 ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : '0 results'}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-700">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Send SMS Footer */}
      <div className="sticky bottom-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{selected.size}</span> selected · <span className="font-semibold text-emerald-600">{smsReady.length}</span> SMS ready
        </div>
        <button
          disabled={smsReady.length === 0}
          onClick={() => toast.info(`${smsReady.length} contacts ready — navigate to Send page to compose message`)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          <Send className="w-4 h-4" /> Send SMS to Selected
        </button>
      </div>
    </div>
  )
}
