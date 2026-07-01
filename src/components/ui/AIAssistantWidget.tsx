'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Wand2, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { generateCampaignDrafts, getAIUsageStats, logAIUsage } from '@/app/actions/ai'

interface AIAssistantWidgetProps {
 onInsertDraft: (draft: string) => void
 context?: { position?: string; subArea?: string }
 isOpen?: boolean
 setIsOpen?: (open: boolean) => void
}

const DAILY_REQUEST_LIMIT = 30
const DAILY_TOKEN_LIMIT = 50000

export default function AIAssistantWidget({ onInsertDraft, context, isOpen, setIsOpen }: AIAssistantWidgetProps) {
 const [localIsOpen, setLocalIsOpen] = useState(false)
 const isWidgetOpen = isOpen !== undefined ? isOpen : localIsOpen
 const toggleWidget = (val: boolean) => {
 if (setIsOpen) setIsOpen(val)
 else setLocalIsOpen(val)
 }

 const [prompt, setPrompt] = useState('')
 const [drafts, setDrafts] = useState<string[]>([])
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')
 
 // Quota states
 const [usageCount, setUsageCount] = useState(0)
 const [usageTokens, setUsageTokens] = useState(0)
 const [useLocalFallback, setUseLocalFallback] = useState(false)

 // Fetch usage stats on mount
 useEffect(() => {
 async function loadStats() {
 const stats = await getAIUsageStats()
 if (stats.fallback) {
 setUseLocalFallback(true)
 loadLocalStats()
 } else {
 setUsageCount(stats.count)
 setUsageTokens(stats.tokens)
 }
 }
 loadStats()
 }, [])

 // Helper: Load stats from localStorage
 const loadLocalStats = () => {
 if (typeof window === 'undefined') return
 const todayStr = new Date().toISOString().substring(0, 10)
 const stored = localStorage.getItem(`concord_ai_usage_${todayStr}`)
 if (stored) {
 try {
 const parsed = JSON.parse(stored)
 setUsageCount(parsed.count || 0)
 setUsageTokens(parsed.tokens || 0)
 } catch {
 // malformed data
 }
 }
 }

 // Helper: Increment stats locally and database
 const recordAIRequest = async (promptText: string, modelName: string, estimatedTokens: number) => {
 const nextCount = usageCount + 1
 const nextTokens = usageTokens + estimatedTokens
 
 setUsageCount(nextCount)
 setUsageTokens(nextTokens)

 if (useLocalFallback) {
 const todayStr = new Date().toISOString().substring(0, 10)
 localStorage.setItem(
 `concord_ai_usage_${todayStr}`,
 JSON.stringify({ count: nextCount, tokens: nextTokens })
 )
 } else {
 const dbResult = await logAIUsage(modelName, promptText, estimatedTokens)
 if (dbResult.fallback) {
 setUseLocalFallback(true)
 // Store locally in addition
 const todayStr = new Date().toISOString().substring(0, 10)
 localStorage.setItem(
 `concord_ai_usage_${todayStr}`,
 JSON.stringify({ count: nextCount, tokens: nextTokens })
 )
 }
 }
 }

 const handleGenerate = async () => {
 if (!prompt.trim()) return
 
 if (usageCount >= DAILY_REQUEST_LIMIT) {
 setError('Daily AI request limit reached. Please try again tomorrow.')
 return
 }

 setLoading(true)
 setError('')
 setDrafts([])

 // Estimate input + instruction tokens
 const estInputTokens = Math.round((prompt.length + 500) / 4)

 const result = await generateCampaignDrafts(prompt, {
 position: context?.position || undefined,
 subArea: context?.subArea || undefined,
 })

 if (result.error) {
 setError(result.error)
 } else {
 setDrafts(result.drafts)
 // Log usage
 const estOutputTokens = result.drafts.reduce((acc, d) => acc + Math.round(d.length / 4), 0)
 const totalEstTokens = estInputTokens + estOutputTokens
 
 // Use fallback model string or default
 await recordAIRequest(prompt, 'gemini-2.5-flash', totalEstTokens)
 }
 setLoading(false)
 }

 const handleSelectDraft = (draft: string) => {
 onInsertDraft(draft)
 toggleWidget(false)
 setPrompt('')
 setDrafts([])
 toast.success('AI draft inserted!')
 }

 return (
 <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 max-w-[calc(100vw-32px)]">
 
 {/* ── Expanded Widget Card ── */}
 {isWidgetOpen && (
 <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-[380px] overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
 
 {/* Header */}
 <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Wand2 className="w-4 h-4 text-violet-600 animate-pulse" />
 <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Outreach Assistant</span>
 </div>
 <div className="flex items-center gap-1.5">
 <button 
 onClick={() => toggleWidget(false)}
 className="p-1 hover:bg-slate-200/50 :bg-slate-800/80 rounded-md transition-colors cursor-pointer"
 title="Collapse"
 >
 <ChevronDown className="w-4 h-4 text-slate-500 " />
 </button>
 </div>
 </div>

 {/* Usage indicators */}
 <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-500 ">
 <span className={usageCount >= DAILY_REQUEST_LIMIT ? 'text-rose-500 font-bold' : ''}>
 Daily Requests: {usageCount} / {DAILY_REQUEST_LIMIT}
 </span>
 <span className={usageTokens >= DAILY_TOKEN_LIMIT ? 'text-rose-500 font-bold' : ''}>
 Est. Tokens: {usageTokens.toLocaleString()} / {DAILY_TOKEN_LIMIT.toLocaleString()}
 </span>
 </div>

 {/* Body */}
 <div className="p-4 space-y-3.5 max-h-[360px] overflow-y-auto">
 <div>
 <label className="block text-xs font-bold text-slate-700 mb-1">Outreach Prompt</label>
 <textarea
 rows={2}
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 placeholder="e.g. Invite all Weija coordinators to the campaign meeting this Friday at 5pm..."
 className="w-full bg-slate-55 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all resize-none bg-white "
 />
 </div>

 <button
 onClick={handleGenerate}
 disabled={loading || !prompt.trim() || usageCount >= DAILY_REQUEST_LIMIT}
 className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
 >
 {loading ? (
 <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...</>
 ) : (
 <><Sparkles className="w-3.5 h-3.5" /> Generate 3 SMS Drafts</>
 )}
 </button>

 {error && (
 <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-600 leading-relaxed font-medium">
 {error}
 </div>
 )}

 {drafts.length > 0 && (
 <div className="space-y-2 pt-2 border-t border-slate-100 ">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Click to Select Draft</p>
 {drafts.map((draft, i) => (
 <button
 key={i}
 onClick={() => handleSelectDraft(draft)}
 className="w-full text-left p-3 rounded-lg border border-slate-150 bg-slate-55/30 hover:border-violet-300 :border-violet-500 hover:bg-violet-50/30 :bg-violet-950/20 transition-all group cursor-pointer bg-white "
 >
 <p className="text-xs text-slate-700 leading-relaxed">{draft}</p>
 <div className="flex items-center justify-between mt-2 text-[9px] font-medium text-slate-400">
 <span className={draft.length > 160 ? 'text-amber-500' : 'text-emerald-500'}>
 {draft.length} chars ({Math.ceil(draft.length / 160)} SMS part)
 </span>
 <span className="text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">Insert →</span>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {/* ── Collapsed FAB Trigger Button ── */}
 <button
 onClick={() => toggleWidget(!isWidgetOpen)}
 className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-95 transition-all cursor-pointer select-none"
 >
 <Sparkles className="w-4 h-4 animate-pulse" />
 {isWidgetOpen ? 'Collapse Composer' : '✨ AI Compose Assistant'}
 </button>

 </div>
 )
}
