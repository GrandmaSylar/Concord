'use client'

import { useTransition } from 'react'
import { Trash2, Users, Megaphone, UserCheck, GraduationCap, Sparkles, FileText } from 'lucide-react'
import { deleteTemplate } from './actions'

interface Template {
 id: string
 name: string
 content: string
 created_at: string
}

// Parse category metadata out of seeded template titles
function parseTemplateMeta(name: string) {
 const categories = [
 { key: '[Mobilization]', icon: Users, label: 'Mobilization', color: 'text-amber-600 bg-amber-50 border-amber-200/50' },
 { key: '[Outreach]', icon: Megaphone, label: 'Outreach', color: 'text-blue-600 bg-blue-50 border-blue-200/50' },
 { key: '[Voter Care]', icon: UserCheck, label: 'Voter Care', color: 'text-emerald-600 bg-emerald-50 border-emerald-200/50' },
 { key: '[Training]', icon: GraduationCap, label: 'Training', color: 'text-purple-600 bg-purple-50 border-purple-200/50' },
 { key: '[Greetings]', icon: Sparkles, label: 'Greetings', color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200/50' },
 ]

 // Strip emojis
 const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F1E6}-\u{1F1FF}]/gu
 let clean = name.replace(emojiRegex, '').trim()

 for (const cat of categories) {
 if (clean.includes(cat.key)) {
 const displayName = clean.replace(cat.key, '').trim()
 return {
 Icon: cat.icon,
 label: cat.label,
 color: cat.color,
 displayName
 }
 }
 }

 return {
 Icon: FileText,
 label: 'Custom',
 color: 'text-slate-600 bg-slate-50 border-slate-200/60',
 displayName: clean
 }
}

export default function TemplateList({ templates }: { templates: Template[] }) {
 const [isPending, startTransition] = useTransition()

 const handleDelete = (id: string) => {
 if (confirm('Are you sure you want to delete this template?')) {
 startTransition(async () => {
 await deleteTemplate(id)
 })
 }
 }

 return (
 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
 <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
 <h3 className="font-medium text-gray-900 ">Saved Templates</h3>
 </div>
 
 {templates.length === 0 ? (
 <div className="p-8 text-center text-gray-500 ">
 No templates found. Create one to get started.
 </div>
 ) : (
 <ul className="divide-y divide-gray-200 ">
 {templates.map(template => {
 const { Icon, label, color, displayName } = parseTemplateMeta(template.name)
 return (
 <li key={template.id} className="p-4 hover:bg-gray-50 :bg-slate-850/50 transition-colors flex justify-between items-start gap-4">
 <div className="flex-shrink-0 p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-500 ">
 <Icon className="w-5 h-5" />
 </div>
 <div className="flex-1 pr-4 min-w-0">
 <div className="flex items-center flex-wrap gap-2">
 <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
 <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${color}`}>
 {label}
 </span>
 </div>
 <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{template.content}</p>
 </div>
 <button
 onClick={() => handleDelete(template.id)}
 disabled={isPending}
 className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 :bg-red-950/20 transition-colors shrink-0 cursor-pointer"
 title="Delete template"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </li>
 )
 })}
 </ul>
 )}
 </div>
 )
}
