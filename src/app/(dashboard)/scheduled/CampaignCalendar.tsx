'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Clock, MessageSquare, X, CalendarDays, Loader2 } from 'lucide-react'
import { getScheduledByMonth } from './calendar-actions'

const MONTH_NAMES = [
 'January', 'February', 'March', 'April', 'May', 'June',
 'July', 'August', 'September', 'October', 'November', 'December'
]
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type ScheduledItem = {
 id: string
 contact_id: string
 message: string
 trigger_time: string
 status: string
 contacts: { name: string; phone: string } | null
}

export default function CampaignCalendar() {
 const now = new Date()
 const [year, setYear] = useState(now.getFullYear())
 const [month, setMonth] = useState(now.getMonth())
 const [events, setEvents] = useState<ScheduledItem[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedDay, setSelectedDay] = useState<number | null>(null)

 useEffect(() => {
 async function load() {
 setLoading(true)
 const data = await getScheduledByMonth(year, month)
 // Supabase returns joined relations as arrays; normalize to single object
 const normalized: ScheduledItem[] = data.map((d: any) => ({
 ...d,
 contacts: Array.isArray(d.contacts) ? d.contacts[0] || null : d.contacts,
 }))
 setEvents(normalized)
 setLoading(false)
 }
 load()
 }, [year, month])

 const prevMonth = () => {
 if (month === 0) { setMonth(11); setYear(y => y - 1) }
 else setMonth(m => m - 1)
 setSelectedDay(null)
 }
 const nextMonth = () => {
 if (month === 11) { setMonth(0); setYear(y => y + 1) }
 else setMonth(m => m + 1)
 setSelectedDay(null)
 }

 // Build the calendar grid
 const firstDayOfMonth = new Date(year, month, 1).getDay()
 const daysInMonth = new Date(year, month + 1, 0).getDate()
 const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7

 // Group events by day
 const eventsByDay: Record<number, ScheduledItem[]> = {}
 events.forEach(ev => {
 const day = new Date(ev.trigger_time).getDate()
 if (!eventsByDay[day]) eventsByDay[day] = []
 eventsByDay[day].push(ev)
 })

 const today = new Date()
 const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
 const todayDate = today.getDate()

 // Events for the selected day
 const selectedDayEvents = selectedDay ? (eventsByDay[selectedDay] || []) : []

 return (
 <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
 {/* Header */}
 <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
 <div className="flex items-center gap-3">
 <CalendarDays className="w-5 h-5 text-slate-400" />
 <h2 className="text-base font-bold text-slate-900">Campaign Calendar</h2>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
 <ChevronLeft className="w-4 h-4 text-slate-600" />
 </button>
 <span className="text-sm font-bold text-slate-800 min-w-[140px] text-center">
 {MONTH_NAMES[month]} {year}
 </span>
 <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
 <ChevronRight className="w-4 h-4 text-slate-600" />
 </button>
 </div>
 </div>

 {/* Calendar Grid */}
 <div className="p-4 relative">
 {loading && (
 <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
 <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
 </div>
 )}

 {/* Day labels */}
 <div className="grid grid-cols-7 mb-2">
 {DAY_LABELS.map(d => (
 <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2">
 {d}
 </div>
 ))}
 </div>

 {/* Day cells */}
 <div className="grid grid-cols-7 gap-1">
 {Array.from({ length: totalCells }).map((_, i) => {
 const dayNum = i - firstDayOfMonth + 1
 const isValid = dayNum >= 1 && dayNum <= daysInMonth
 const isToday = isCurrentMonth && dayNum === todayDate
 const dayEvents = isValid ? (eventsByDay[dayNum] || []) : []
 const isSelected = selectedDay === dayNum
 const hasPending = dayEvents.some(e => e.status === 'pending')
 const hasSent = dayEvents.some(e => e.status === 'sent')
 const hasFailed = dayEvents.some(e => e.status === 'failed')

 return (
 <button
 key={i}
 disabled={!isValid}
 onClick={() => isValid && setSelectedDay(dayNum === selectedDay ? null : dayNum)}
 className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
 ${!isValid ? 'opacity-0 cursor-default' : 'cursor-pointer hover:bg-slate-50'}
 ${isToday ? 'bg-indigo-50 border-2 border-indigo-300 font-extrabold text-indigo-700' : 'font-medium text-slate-700'}
 ${isSelected && !isToday ? 'bg-slate-100 border-2 border-slate-300' : ''}
 ${isSelected && isToday ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}
 `}
 >
 {isValid && <span className="text-xs">{dayNum}</span>}
 {/* Event dots */}
 {dayEvents.length > 0 && (
 <div className="flex items-center gap-0.5 mt-0.5">
 {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
 {hasSent && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
 {hasFailed && <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
 </div>
 )}
 </button>
 )
 })}
 </div>

 {/* Legend */}
 <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 justify-center">
 <div className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-amber-400" />
 <span className="text-[10px] text-slate-500 font-medium">Pending</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-emerald-400" />
 <span className="text-[10px] text-slate-500 font-medium">Sent</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-rose-400" />
 <span className="text-[10px] text-slate-500 font-medium">Failed</span>
 </div>
 </div>
 </div>

 {/* Selected Day Detail Panel */}
 {selectedDay !== null && (
 <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-4">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-sm font-bold text-slate-800">
 {selectedDay} {MONTH_NAMES[month]} {year}
 <span className="ml-2 text-xs font-semibold text-slate-400">
 ({selectedDayEvents.length} scheduled)
 </span>
 </h3>
 <button onClick={() => setSelectedDay(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
 <X className="w-4 h-4 text-slate-400" />
 </button>
 </div>

 {selectedDayEvents.length === 0 ? (
 <p className="text-xs text-slate-400 italic">No scheduled messages for this day.</p>
 ) : (
 <div className="space-y-2 max-h-48 overflow-y-auto">
 {selectedDayEvents.map(ev => {
 const time = new Date(ev.trigger_time).toLocaleTimeString('en-GB', {
 hour: '2-digit', minute: '2-digit'
 })
 const statusColor =
 ev.status === 'sent' ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
 : ev.status === 'failed' ? 'text-rose-600 bg-rose-50 border-rose-100'
 : 'text-amber-600 bg-amber-50 border-amber-100'

 return (
 <div key={ev.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
 <div className="p-1.5 bg-indigo-50 rounded-md shrink-0 mt-0.5">
 <Clock className="w-3.5 h-3.5 text-indigo-500" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-slate-800">{time}</span>
 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
 {ev.status}
 </span>
 </div>
 <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ev.message}</p>
 {ev.contacts && (
 <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
 <MessageSquare className="w-3 h-3" />
 {ev.contacts.name} · {ev.contacts.phone}
 </p>
 )}
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>
 )}
 </div>
 )
}
