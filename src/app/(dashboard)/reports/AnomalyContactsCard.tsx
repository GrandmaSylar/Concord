'use client'

import { useState } from 'react'
import { AlertTriangle, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AnomalyContact {
  id: string
  name: string
  phone: string
  sub_area: string | null
  group_name: string | null
  polling_station: string | null
}

export default function AnomalyContactsCard({ anomalies }: { anomalies: AnomalyContact[] }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = anomalies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) || 
    (c.sub_area || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden flex flex-col gap-4">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/30 flex items-start gap-3">
        <div className="p-2 bg-amber-100/50 text-amber-700 rounded-lg mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-amber-950 flex items-center gap-1.5">
            Phone Number Anomaly Reports
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {anomalies.length} Detected
            </span>
          </h2>
          <p className="text-xs text-amber-850/80 font-medium mt-0.5">
            List of contacts with phone numbers exceeding 10 digits. (Typical copy-paste errors or typos).
          </p>
        </div>
      </div>

      {/* Filter / Search */}
      {anomalies.length > 0 && (
        <div className="px-6 relative w-full max-w-sm">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search anomalies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full rounded-lg border-slate-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-xs py-2 px-3 border bg-white text-slate-900"
          />
        </div>
      )}

      {/* Body Table */}
      <div className="overflow-x-auto relative min-h-[100px]">
        {anomalies.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-sm font-bold text-slate-800">No anomalies found!</p>
            <p className="text-xs text-slate-500">All contact phone numbers have 10 digits or less.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 italic">
            No contacts matched your search criteria.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Digits Length</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sub-Area</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 font-medium">
              {filtered.map((c) => {
                const digitsCount = c.phone.replace(/\D/g, '').length
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-900 font-bold">{c.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-amber-700">{c.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        {digitsCount} digits
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{c.sub_area || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                      <Link 
                        href={`/contacts?search=${encodeURIComponent(c.name)}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 hover:text-blue-850 transition-all hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer"
                      >
                        Edit Contact
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
