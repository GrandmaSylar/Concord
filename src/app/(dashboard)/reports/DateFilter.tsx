'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const handleApply = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    router.push(`/reports?${params.toString()}`)
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    router.push('/reports')
  }

  const handleQuickSelect = (range: 'today' | 'yesterday' | 'week') => {
    const today = new Date()
    let start = new Date()
    
    if (range === 'today') {
      // both start and today are the same
    } else if (range === 'yesterday') {
      start.setDate(today.getDate() - 1)
    } else if (range === 'week') {
      start.setDate(today.getDate() - 7)
    }

    const startStr = start.toISOString().substring(0, 10)
    const endStr = today.toISOString().substring(0, 10)

    setStartDate(startStr)
    setEndDate(endStr)

    const params = new URLSearchParams()
    params.set('startDate', startStr)
    params.set('endDate', endStr)
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex flex-wrap gap-4 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
        <input 
          type="date" 
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:ring-blue-550 focus:border-blue-550 bg-white text-slate-900 font-medium"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</label>
        <input 
          type="date" 
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:ring-blue-550 focus:border-blue-550 bg-white text-slate-900 font-medium"
        />
      </div>

      <div className="flex gap-2">
        <button 
          onClick={handleApply}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
        >
          Apply Filter
        </button>
        <button 
          onClick={handleClear}
          className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold bg-white transition-all cursor-pointer"
        >
          Clear
        </button>
      </div>

      <div className="h-8 w-px bg-slate-200 hidden md:block self-center"></div>

      <div className="flex gap-1.5 flex-wrap">
        <button 
          onClick={() => handleQuickSelect('today')}
          className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 font-semibold cursor-pointer active:scale-95"
        >
          Today
        </button>
        <button 
          onClick={() => handleQuickSelect('yesterday')}
          className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 font-semibold cursor-pointer active:scale-95"
        >
          Yesterday
        </button>
        <button 
          onClick={() => handleQuickSelect('week')}
          className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-xs text-slate-700 font-semibold cursor-pointer active:scale-95"
        >
          Last 7 Days
        </button>
      </div>
    </div>
  )
}
