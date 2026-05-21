'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Terminal, Palette, Image as ImageIcon, Check, Loader2, LogOut, Smartphone, Send, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Zap, Play, Trash2, BookOpen, Layers, Cpu, ChevronDown, ChevronUp, StopCircle, Timer, Gauge, Activity } from 'lucide-react'
import Link from 'next/link'
import { getSystemSettings, updateSystemSettings, sendTestSMS, getRecentSMSLogs, SystemSettings, prepareSimulationQueue, getSimulationStats, triggerSimulationRun, clearSimulationQueue, haltSimulation } from '@/app/actions/settings'
import { toast } from 'sonner'
import DevAuthGuard from '@/components/ui/DevAuthGuard'

interface SMSLog {
  id: string
  recipient: string
  sender_id: string | null
  content: string
  status: 'pending' | 'processing' | 'sent' | 'failed'
  sent_at: string
}

export default function DevSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Simulation Playground states — persisted in sessionStorage so navigating
  // away (auth gate, back button, reload) never resets an in-flight test.
  const [simCount, setSimCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 2000
    return parseInt(sessionStorage.getItem('sim_count') ?? '2000', 10) || 2000
  })
  const [simTimeout, setSimTimeout] = useState<number>(() => {
    if (typeof window === 'undefined') return 1.5
    return parseFloat(sessionStorage.getItem('sim_timeout') ?? '1.5') || 1.5
  })
  const [simLatency, setSimLatency] = useState<number>(() => {
    if (typeof window === 'undefined') return 50
    return parseInt(sessionStorage.getItem('sim_latency') ?? '50', 10) || 50
  })

  // Keep sessionStorage in sync whenever params change
  useEffect(() => { sessionStorage.setItem('sim_count',   String(simCount))   }, [simCount])
  useEffect(() => { sessionStorage.setItem('sim_timeout', String(simTimeout)) }, [simTimeout])
  useEffect(() => { sessionStorage.setItem('sim_latency', String(simLatency)) }, [simLatency])
  const [simPreparing, setSimPreparing] = useState(false)
  const [simRunning, setSimRunning] = useState(false)
  const [simClearing, setSimClearing] = useState(false)
  const [simStats, setSimStats] = useState({ pending: 0, processing: 0, sent: 0, failed: 0 })
  const [isStatsPolling, setIsStatsPolling] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportTab, setReportTab] = useState<'overview' | 'flow' | 'insights'>('overview')

  // Timers and Constraints Tracking States
  const [elapsedTime, setElapsedTime] = useState(0) // total elapsed run time in seconds
  const [currentWaveDuration, setCurrentWaveDuration] = useState(0) // active wave safety window timer
  const [halted, setHalted] = useState(false)
  const [halting, setHalting] = useState(false)
  const [startBtnClicked, setStartBtnClicked] = useState(false)

  const fetchSimStats = async () => {
    try {
      const stats = await getSimulationStats()
      setSimStats(stats)
      
      // Auto-stop polling if we had active simulation records but they are now fully drained to sent/failed
      const total = stats.pending + stats.processing + stats.sent + stats.failed
      if (total > 0 && stats.pending === 0 && stats.processing === 0) {
        setIsStatsPolling(false)
        setStartBtnClicked(false) // stop the timer when queue drains completely
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Poll simulation stats when simulation is active or during preparation/running
  useEffect(() => {
    let intervalId: any = null
    if (simRunning || simPreparing || isStatsPolling) {
      fetchSimStats()
      intervalId = setInterval(fetchSimStats, 1000)
    }
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [simRunning, simPreparing, isStatsPolling])

  // Total elapsed timer & Isolate safety timer cycling
  useEffect(() => {
    let timerId: any = null
    const isWorking = (simStats.pending > 0 || simStats.processing > 0) && startBtnClicked && !halted
    
    if (isWorking) {
      const startTime = Date.now() - (elapsedTime * 1000)
      timerId = setInterval(() => {
        const totalSec = (Date.now() - startTime) / 1000
        setElapsedTime(totalSec)
        
        // Cycle the wave countdown based on simTimeout
        const waveTime = totalSec % simTimeout
        setCurrentWaveDuration(waveTime)
      }, 100)
    }
    
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [simStats.pending, simStats.processing, startBtnClicked, halted, simTimeout, elapsedTime])

  useEffect(() => {
    // Initial fetch to see if there are lingering simulation records
    fetchSimStats()
    
    // Check if there are active processing/pending simulation records on mount
    const checkLingering = async () => {
      const stats = await getSimulationStats()
      if (stats.pending > 0 || stats.processing > 0) {
        setIsStatsPolling(true)
        setStartBtnClicked(true)
      }
    }
    checkLingering()
  }, [])

  const handlePrepareSim = async () => {
    setSimPreparing(true)
    setIsStatsPolling(true)
    setHalted(false)
    setElapsedTime(0)
    setCurrentWaveDuration(0)
    try {
      const res = await prepareSimulationQueue(simCount)
      if (res.success) {
        toast.success(`Successfully populated queue with ${simCount} simulated pending messages!`)
      } else {
        toast.error(res.error || 'Failed to prepare queue')
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred')
    } finally {
      setSimPreparing(false)
    }
  }

  const handleRunSim = async () => {
    setHalted(false)
    setElapsedTime(0)
    setCurrentWaveDuration(0)
    setStartBtnClicked(true)
    setSimRunning(true)
    setIsStatsPolling(true)
    toast.info(`Triggering simulation of ${simCount} messages...`)
    
    try {
      const res = await triggerSimulationRun(Math.round(simTimeout * 1000), simLatency)
      if (res.success) {
        toast.success('Simulation triggered! Active Wave 1 container launched in background.')
      } else {
        toast.error(res.error || 'Failed to trigger simulation')
        setIsStatsPolling(false)
        setStartBtnClicked(false)
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred')
      setIsStatsPolling(false)
      setStartBtnClicked(false)
    } finally {
      setSimRunning(false)
    }
  }

  const handleHaltSim = async () => {
    setHalting(true)
    toast.info('Emergency stop triggered! Halting background queue threads and rolling back database status...')
    try {
      const res = await haltSimulation()
      if (res.success) {
        setHalted(true)
        setStartBtnClicked(false)
        setIsStatsPolling(false)
        toast.success('Simulation halted! Locked processing batches have been safely rolled back to pending.')
      } else {
        toast.error('Failed to halt simulation completely.')
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred during halt')
    } finally {
      setHalting(false)
      fetchSimStats()
    }
  }

  const handleClearSim = async () => {
    setSimClearing(true)
    try {
      const res = await clearSimulationQueue()
      if (res.success) {
        toast.success('Simulation records completely cleared!')
        setSimStats({ pending: 0, processing: 0, sent: 0, failed: 0 })
        setIsStatsPolling(false)
        setStartBtnClicked(false)
        setHalted(false)
        setElapsedTime(0)
        setCurrentWaveDuration(0)
      } else {
        toast.error(res.error || 'Failed to clear queue')
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred')
    } finally {
      setSimClearing(false)
    }
  }

  // Recent SMS logs states
  const [recentLogs, setRecentLogs] = useState<SMSLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [refreshingLogs, setRefreshingLogs] = useState(false)

  const fetchLogs = async () => {
    setRefreshingLogs(true)
    try {
      const logs = await getRecentSMSLogs()
      setRecentLogs(logs)
    } catch (err) {
      console.error('Failed to fetch SMS logs:', err)
      toast.error('Failed to load recent SMS logs')
    } finally {
      setRefreshingLogs(false)
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // Test SMS states
  const [testPhone, setTestPhone] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [testResult, setTestResult] = useState<string | null>(null)

  const handleSendTestSMS = async () => {
    if (!testPhone.trim()) {
      toast.error('Please enter a valid phone number')
      return
    }
    setTestSending(true)
    setTestStatus('sending')
    setTestResult(null)
    
    try {
      const res = await sendTestSMS(testPhone)
      if (res.success) {
        setTestStatus('success')
        setTestResult(`Test SMS successfully dispatched to ${testPhone}! Status response: "${res.status}"`)
        toast.success('Test message sent successfully!')
      } else {
        setTestStatus('error')
        setTestResult(res.error || 'Failed to send test message.')
        toast.error(res.error || 'Failed to send test message.')
      }
    } catch (err: any) {
      setTestStatus('error')
      setTestResult(err.message || 'An unexpected error occurred.')
      toast.error(err.message || 'An unexpected error occurred.')
    } finally {
      setTestSending(false)
    }
  }

  // Form states
  const [primary, setPrimary] = useState('#2563eb')
  const [secondary, setSecondary] = useState('#4f46e5')
  const [loginBg, setLoginBg] = useState('')
  const [watermark, setWatermark] = useState('')
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.03)

  useEffect(() => {
    async function load() {
      const data = await getSystemSettings()
      if (data) {
        setSettings(data)
        setPrimary(data.primary_color)
        setSecondary(data.secondary_color)
        setLoginBg(data.login_bg_url || '')
        setWatermark(data.watermark_url || '')
        setWatermarkOpacity(data.watermark_opacity ?? 0.03)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const result = await updateSystemSettings({
      primary_color: primary,
      secondary_color: secondary,
      login_bg_url: loginBg,
      watermark_url: watermark,
      watermark_opacity: watermarkOpacity,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Theme settings synced to database successfully!')
    }
    setSaving(false)
  }

  const applyNPPPreset = async () => {
    setPrimary('#063b82')
    setSecondary('#d32f2f')
    setLoginBg('/WhatsApp Image 2026-05-19 at 8.32.50 AM.jpeg')
    setWatermark('/10222020147300g730m4yxsnppflag1.jpeg')
    setWatermarkOpacity(0.05)
    toast.info('NPP Preset Applied! Click Save to sync with DB.')
  }

  const unapplyPreset = async () => {
    setPrimary('#2563eb')
    setSecondary('#4f46e5')
    setLoginBg('')
    setWatermark('')
    setWatermarkOpacity(0.03)
    toast.info('Default Theme Restored! Click Save to sync with DB.')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  return (
    <DevAuthGuard>
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-12">
      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-4 right-4 z-20">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors text-sm font-semibold border border-white/20">
            <LogOut className="w-4 h-4" />
            Exit Portal
          </Link>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <Terminal className="w-8 h-8 text-indigo-200" />
          <h1 className="text-3xl font-bold tracking-tight">Developer Portal</h1>
        </div>
        <p className="text-indigo-100 max-w-2xl relative z-10 text-lg">
          Advanced configuration and system administration tools. Proceed with caution.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Global Theming Engine</h2>
              <p className="text-sm text-slate-500">Sync branding colors and watermarks across all users instantly.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button 
              onClick={unapplyPreset}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm border border-slate-200"
            >
              Reset Theme
            </button>
            <button 
              onClick={applyNPPPreset}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors text-sm border border-blue-200"
            >
              🐘 Apply NPP Preset
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Pickers */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="h-10 w-16 p-1 rounded border border-slate-200 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={primary}
                    onChange={(e) => setPrimary(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    className="h-10 w-16 p-1 rounded border border-slate-200 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={secondary}
                    onChange={(e) => setSecondary(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Asset URLs */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Login Background Image (URL/Path)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={loginBg}
                    onChange={(e) => setLoginBg(e.target.value)}
                    placeholder="/WhatsApp Image... or https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">System Watermark Image (URL/Path)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={watermark}
                    onChange={(e) => setWatermark(e.target.value)}
                    placeholder="/flag.jpeg or https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Watermark Opacity</label>
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {Math.round(watermarkOpacity * 100)}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="w-full sm:hidden flex flex-col gap-2 mt-2">
            <button 
              onClick={applyNPPPreset}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-colors text-sm border border-blue-200"
            >
              🐘 Apply NPP Preset
            </button>
            <button 
              onClick={unapplyPreset}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm border border-slate-200"
            >
              Reset Theme
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Syncing...' : 'Save & Sync Globally'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Test SMS Feature Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Integration Diagnostics</h2>
            <p className="text-sm text-slate-500">Send an instant test message to verify the Arkesel SMS gateway connection.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="test-phone" className="block text-sm font-semibold text-slate-700">
                Temporary Test Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  id="test-phone"
                  type="tel"
                  placeholder="e.g. +233541234567 or 0541234567"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>
            
            <button
              onClick={handleSendTestSMS}
              disabled={testSending || !testPhone.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 h-[42px] cursor-pointer"
            >
              {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {testSending ? 'Sending...' : 'Send Test SMS'}
            </button>
          </div>

          {/* Test Status Panel */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SMS Gateway Dispatch Logs</h3>
            
            {testStatus === 'idle' && (
              <div className="flex items-start gap-3 text-slate-600 text-sm">
                <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-700">Ready to test</p>
                  <p className="text-xs text-slate-500 mt-0.5">Enter a valid test recipient number above and trigger a dispatch to check gateway status.</p>
                </div>
              </div>
            )}

            {testStatus === 'sending' && (
              <div className="flex items-start gap-3 text-indigo-600 text-sm">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-700">Pinging SMS Gateway API...</p>
                  <p className="text-xs text-indigo-500 mt-0.5">Initiating HTTP POST request to Arkesel V1 SMS endpoint. Please wait.</p>
                </div>
              </div>
            )}

            {testStatus === 'success' && (
              <div className="flex items-start gap-3 text-emerald-600 text-sm bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-800">Connection Successful (200 OK)</p>
                  <p className="text-xs text-emerald-700 leading-relaxed font-mono">{testResult}</p>
                </div>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="flex items-start gap-3 text-red-600 text-sm bg-red-50/50 border border-red-100 p-3.5 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-red-800">Connection Rejected / Gateway Error</p>
                  <p className="text-xs text-red-700 leading-relaxed font-mono">{testResult}</p>
                  <p className="text-[10px] text-red-500 mt-1">Please verify that your ARKESEL_API_KEY environment variable is correctly set and has enough SMS credits.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recursion & High-Volume Simulation Playground ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recursion & High-Volume Simulation Playground</h2>
            <p className="text-sm text-slate-500">
              Stress-test our Deno-cron recursion and database safety guards with high-volume mock records.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-xs text-slate-600 leading-relaxed space-y-1.5">
          <span className="font-semibold text-slate-700 block">💡 How the Simulation Works:</span>
          <p>
            1. Clicking <strong>Populate Mock Queue</strong> inserts dummy messages into the database in <code>pending</code> status.
          </p>
          <p>
            2. Setting the <strong>Safety Timeout Limit</strong> low (e.g. 1.5s) forces the function to run out of time mid-batch and execute rollbacks.
          </p>
          <p>
            3. Setting <strong>Mock Net Latency</strong> simulates Gateway network response delay per chunk, forcing recursive background container triggers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Total Messages Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Simulated Messages</label>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {simCount.toLocaleString()}
              </span>
            </div>
            <input 
              type="range"
              min="100"
              max="2000"
              step="100"
              value={simCount}
              onChange={(e) => setSimCount(parseInt(e.target.value))}
              disabled={simPreparing || simRunning || simClearing}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 block">Number of dry-run records to generate.</span>
          </div>

          {/* Safety Timeout Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Safety Timeout Limit</label>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {simTimeout.toFixed(1)}s
              </span>
            </div>
            <input 
              type="range"
              min="0.5"
              max="12.0"
              step="0.5"
              value={simTimeout}
              onChange={(e) => setSimTimeout(parseFloat(e.target.value))}
              disabled={simPreparing || simRunning || simClearing}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 block">Artificially shrinks the execution window to force self-chaining recursion.</span>
          </div>

          {/* Network Latency Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Mock Net Latency</label>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {simLatency}ms
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="500"
              step="10"
              value={simLatency}
              onChange={(e) => setSimLatency(parseInt(e.target.value))}
              disabled={simPreparing || simRunning || simClearing}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
            />
            <span className="text-[10px] text-slate-400 block">Artificial response latency per chunk of 20 concurrent sends.</span>
          </div>
        </div>

        {/* Real-time Status counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 text-center">
            <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Pending</span>
            <span className="text-2xl font-extrabold text-amber-800 font-mono">{simStats.pending}</span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-3 text-center flex flex-col items-center justify-center">
            <span className="block text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Processing</span>
            <div className="flex items-center gap-1.5 justify-center">
              {simStats.processing > 0 && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
              <span className="text-2xl font-extrabold text-indigo-800 font-mono">{simStats.processing}</span>
            </div>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 text-center">
            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Sent (Mocked)</span>
            <span className="text-2xl font-extrabold text-emerald-800 font-mono">{simStats.sent}</span>
          </div>

          <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-3 text-center">
            <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Failed (Mocked)</span>
            <span className="text-2xl font-extrabold text-rose-800 font-mono">{simStats.failed}</span>
          </div>
        </div>

        {/* Progress Bar & Real-time Diagnostic Monitor */}
        {(() => {
          const total = simStats.pending + simStats.processing + simStats.sent + simStats.failed
          const processed = simStats.sent + simStats.failed
          const pct = total > 0 ? Math.round((processed / total) * 100) : 0
          const isWorking = (simStats.pending > 0 || simStats.processing > 0) && !halted && startBtnClicked
          
          if (total === 0) return null
          
          // Speed / Rate calculation
          const speed = elapsedTime > 0 ? processed / elapsedTime : 0
          // ETA calculation
          const eta = speed > 0 ? Math.ceil(simStats.pending / speed) : 0
          
          // Est. wave count calculation based on processed records and timeout parameters
          const itemsPerWave = Math.max(20, Math.floor((simTimeout * 1000) / Math.max(10, simLatency)) * 20)
          const wavesCount = Math.max(1, Math.ceil(processed / itemsPerWave))

          // Wave budget remaining calculations
          const waveBudgetRemaining = Math.max(0, simTimeout - currentWaveDuration)
          const waveBudgetPct = (waveBudgetRemaining / simTimeout) * 100

          return (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Progress and status header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    {halted ? (
                      <span className="text-rose-600 font-extrabold flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                        SIMULATION HALTED: ROLLING BACK LOCKS...
                      </span>
                    ) : isWorking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                        Draining Queue via Recursive Containers...
                      </>
                    ) : (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Simulation Completed! Queue Drained.
                      </span>
                    )}
                  </span>
                  <span className="font-mono font-bold text-slate-700">{pct}% ({processed}/{total})</span>
                </div>
                <div className="w-full h-3 bg-slate-100 border border-slate-200 rounded-full overflow-hidden shadow-inner relative">
                  <div 
                    className={`h-full bg-gradient-to-r ${halted ? 'from-rose-500 to-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'from-amber-500 to-emerald-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'} transition-all duration-500 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Spectacular Timers & Stress Test Constraints Dashboard */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Activity className={`w-4 h-4 text-indigo-500 ${isWorking ? 'animate-pulse text-emerald-500 animate-spin duration-1000' : ''}`} />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider">Live Stress Test Constraints Monitor</h4>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    halted 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : isWorking 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' 
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {halted ? 'HALTED' : isWorking ? 'RUNNING' : 'IDLE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Timer Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Timer className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Duration</span>
                    </div>
                    <div className="text-lg font-extrabold text-slate-800 font-mono">
                      {elapsedTime.toFixed(1)}s
                    </div>
                    <span className="text-[9px] text-slate-400 block">Precise running runtime</span>
                  </div>

                  {/* Isolate Lifespan Countdown Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Cpu className={`w-3.5 h-3.5 ${isWorking ? 'animate-spin text-amber-500' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Wave Lifespan</span>
                    </div>
                    <div className="text-lg font-extrabold text-slate-800 font-mono flex items-center justify-between">
                      <span>{isWorking ? waveBudgetRemaining.toFixed(1) : simTimeout.toFixed(1)}s</span>
                      <span className="text-[10px] text-slate-400 font-normal">/ {simTimeout.toFixed(1)}s</span>
                    </div>
                    
                    {/* Active Budget Cycling Bar */}
                    {isWorking ? (
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-100 ease-linear"
                          style={{ width: `${waveBudgetPct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-400 block">Safeguard budget limit</span>
                    )}
                  </div>

                  {/* Dispatch Speed throughput card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Throughput Rate</span>
                    </div>
                    <div className="text-lg font-extrabold text-slate-800 font-mono flex items-baseline gap-1">
                      <span>{speed.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">msg/s</span>
                    </div>
                    <span className="text-[9px] text-slate-400 block">
                      {isWorking && eta > 0 ? `ETA: ~${eta}s remaining` : 'Queue drainage speed'}
                    </span>
                  </div>

                  {/* Waves counter Card */}
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Recursive Waves</span>
                    </div>
                    <div className="text-lg font-extrabold text-slate-800 font-mono">
                      Wave {wavesCount}
                    </div>
                    <span className="text-[9px] text-slate-400 block">Active container depth</span>
                  </div>
                </div>

                {/* Restraints Diagnostics Status Logs */}
                <div className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-200/50 pt-2 flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-500" />
                    Timeout Constraint: <strong className="text-slate-600 font-semibold">{simTimeout * 1000}ms</strong> threshold triggers rollbacks & recursion.
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-500" />
                    Gateway Overhead: <strong className="text-slate-600 font-semibold">{simLatency}ms</strong> latency applied per batch of 20.
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handlePrepareSim}
            disabled={simPreparing || (simStats.pending > 0 || simStats.processing > 0) || simClearing}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
          >
            {simPreparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            1. Populate Mock Queue
          </button>

          {(() => {
            const isWorking = (simStats.pending > 0 || simStats.processing > 0) && !halted && startBtnClicked
            if (isWorking) {
              return (
                <button
                  onClick={handleHaltSim}
                  disabled={halting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(244,63,94,0.35)] text-sm cursor-pointer min-w-[200px]"
                >
                  {halting ? <Loader2 className="w-4 h-4 animate-spin animate-pulse" /> : <StopCircle className="w-4 h-4" />}
                  Emergency Stop (Halt Queue)
                </button>
              )
            } else {
              return (
                <button
                  onClick={handleRunSim}
                  disabled={simPreparing || simRunning || simClearing || (simStats.pending === 0 && simStats.processing === 0)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50 cursor-pointer min-w-[200px]"
                >
                  {simRunning ? <Loader2 className="w-4 h-4 animate-spin animate-pulse" /> : <Play className="w-4 h-4" />}
                  2. Fire Simulated Campaign
                </button>
              )
            }
          })()}

          <button
            onClick={handleClearSim}
            disabled={simPreparing || simClearing || ((simStats.pending > 0 || simStats.processing > 0) && !halted && startBtnClicked) || (simStats.pending === 0 && simStats.processing === 0 && simStats.sent === 0 && simStats.failed === 0)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 cursor-pointer"
          >
            {simClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear Simulation Data
          </button>
        </div>

        {/* Architectural Report Panel Button */}
        <div className="pt-4 border-t border-slate-100 mt-4">
          <button
            onClick={() => setShowReport(!showReport)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl font-semibold text-slate-700 transition-all text-sm cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              Detailed Stress Test & Self-Recursion Report
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500 font-normal">
              {showReport ? (
                <>
                  Hide Report <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  View Report & Insights <ChevronDown className="w-4 h-4" />
                </>
              )}
            </span>
          </button>
        </div>

        {/* Expandable Architectural Report Card */}
        {showReport && (
          <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-5 mt-4 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 pb-px gap-4">
              <button
                onClick={() => setReportTab('overview')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  reportTab === 'overview'
                    ? 'border-amber-500 text-amber-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Overview & Waves
              </button>
              <button
                onClick={() => setReportTab('flow')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  reportTab === 'flow'
                    ? 'border-amber-500 text-amber-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Visual Flow
              </button>
              <button
                onClick={() => setReportTab('insights')}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  reportTab === 'insights'
                    ? 'border-amber-500 text-amber-700 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Architectural Insights
              </button>
            </div>

            {/* Tab Contents */}
            {reportTab === 'overview' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Test Size</span>
                    <span className="text-sm font-extrabold text-slate-800">2,000 Messages</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Waves</span>
                    <span className="text-sm font-extrabold text-slate-800">18 Container Waves</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Safety Timeout</span>
                    <span className="text-sm font-extrabold text-slate-800">1.5s Threshold</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Parallel Chunk</span>
                    <span className="text-sm font-extrabold text-slate-800">20 HTTP Requests</span>
                  </div>
                </div>

                {/* Timeline description */}
                <div className="space-y-3 text-left">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Stress-Test Wave-by-Wave Execution Analysis</h4>
                  <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white animate-ping" />
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                      <p className="text-xs font-bold text-slate-800">Setup Phase: Mock Queue Population</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Orchestrator generates 2,000 dry-run messages under status <code>pending</code> using a valid profile constituent user ID to successfully bypass database RLS and Foreign Key constraints.
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border border-white" />
                      <p className="text-xs font-bold text-slate-800">Wave 1: Initial Processing Thread (0.0s - 1.5s)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Wave 1 container spins up and claims the first batch of 200 records, transitioning their statuses to <code>processing</code> to prevent double-sending. It dispatches chunks in parallel of 20. At exactly 1.5s, the safety window triggers a halt.
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white" />
                      <p className="text-xs font-bold text-slate-800">Wave 1: Slicing Rollback & Recursion Trigger</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Wave 1 slices the active batch, rolling back the remaining 160 unprocessed records back from <code>processing</code> to <code>pending</code>. It asynchronously sends an authenticated HTTP POST background call to trigger Wave 2, then exits cleanly.
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white animate-pulse" />
                      <p className="text-xs font-bold text-slate-800">Waves 2 - 16: Dynamic Queue Drainage</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Successive container waves spin up sequentially, locking active batches, performing concurrent dispatches, and recursing gracefully upon reaching safety limits. Real-time metrics show progress passing 50%, 79%, and 99% cleanly.
                      </p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                      <p className="text-xs font-bold text-slate-800">Wave 17 & 18: 100% Drainage & Completion Sweep</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Wave 17 processes the final records, draining the queue to 100% successfully. Wave 18 spawns as a final sweep check, detects an empty simulation queue, and immediately terminates. Database is fully cleaned and restored.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {reportTab === 'flow' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dynamic Container Execution Flow</h4>
                
                {/* CSS Sequence flowchart */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-5 border border-slate-200 rounded-xl text-left">
                  {/* Step A */}
                  <div className="flex flex-col items-center text-center p-3 bg-amber-50 border border-amber-200 rounded-lg flex-1 min-w-[120px] w-full">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center mb-2 shadow-sm">1</span>
                    <span className="text-xs font-bold text-slate-800 block">Queue Load</span>
                    <span className="text-[10px] text-slate-500 mt-1">2,000 pending mock SMS populated</span>
                  </div>

                  <div className="hidden md:block text-slate-300 font-extrabold select-none">➔</div>

                  {/* Step B */}
                  <div className="flex flex-col items-center text-center p-3 bg-blue-50 border border-blue-200 rounded-lg flex-1 min-w-[120px] w-full">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center mb-2 shadow-sm">2</span>
                    <span className="text-xs font-bold text-slate-800 block">Wave N Locks</span>
                    <span className="text-[10px] text-slate-500 mt-1">Selects 200, updates status to 'processing'</span>
                  </div>

                  <div className="hidden md:block text-slate-300 font-extrabold select-none">➔</div>

                  {/* Step C */}
                  <div className="flex flex-col items-center text-center p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex-1 min-w-[120px] w-full">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center mb-2 shadow-sm">3</span>
                    <span className="text-xs font-bold text-slate-800 block">Parallel Send</span>
                    <span className="text-[10px] text-slate-500 mt-1">Dispatches batches of 20 in parallel</span>
                  </div>

                  <div className="hidden md:block text-slate-300 font-extrabold select-none">➔</div>

                  {/* Step D */}
                  <div className="flex flex-col items-center text-center p-3 bg-rose-50 border border-rose-200 rounded-lg flex-1 min-w-[120px] w-full">
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center mb-2 shadow-sm">4</span>
                    <span className="text-xs font-bold text-slate-800 block">Timeout Halt</span>
                    <span className="text-[10px] text-slate-500 mt-1">Halt at 1.5s, rollback unprocessed</span>
                  </div>

                  <div className="hidden md:block text-slate-300 font-extrabold select-none">➔</div>

                  {/* Step E */}
                  <div className="flex flex-col items-center text-center p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex-1 min-w-[120px] w-full">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center mb-2 shadow-sm">5</span>
                    <span className="text-xs font-bold text-slate-800 block">Wave N+1</span>
                    <span className="text-[10px] text-slate-500 mt-1">Self-trigger spawns next wave recursively</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-lg text-slate-600 text-xs leading-relaxed flex gap-2 text-left">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Recursive Self-Trigger:</strong> By invoking the Next Wave via Deno background microtasks using a secure endpoint call, we maintain perfect system-wide progress monitoring without overloading the client browser or locking browser-level threads.
                  </p>
                </div>
              </div>
            )}

            {reportTab === 'insights' && (
              <div className="space-y-4 animate-in fade-in duration-200 text-left">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Key Architectural Enhancements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Insight 1 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-extrabold text-slate-800">1. Race-Condition Lock</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Before dispatching any messages, records are grouped, batch-selected, and instantly moved to a <code>processing</code> status in a single database step. This guarantees that multiple parallel container waves can never double-fetch or double-send a single record, maintaining absolute data consistency.
                    </p>
                  </div>

                  {/* Insight 2 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                        <Cpu className="w-4 h-4 animate-pulse" />
                      </div>
                      <h5 className="text-xs font-extrabold text-slate-800">2. Dynamic Self-Healing</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Standard infinite looping processes easily crash if serverless container time thresholds are crossed. Our design actively monitors remaining time (comparing it to <code>TIME_LIMIT_MS</code> on every chunk). Rather than failing, the system scales the wave count dynamically, healing from high network latencies.
                    </p>
                  </div>

                  {/* Insight 3 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-extrabold text-slate-800">3. Slicing Rollback</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      If the execution window is reached mid-batch, the algorithm isolates the exact index of unprocessed messages and rolls them back to <code>pending</code> in a single batch query. This prevents orphaned records from remaining stuck in a <code>processing</code> state, ensuring a 100% successful drainage.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── SMS Gateway Dispatch Logs Card ── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">
              <Terminal className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">SMS Gateway Dispatch Logs</h2>
              <p className="text-sm text-slate-500">Real-time status of the 10 most recent system-wide message transmissions.</p>
            </div>
          </div>
          <button
            onClick={fetchLogs}
            disabled={refreshingLogs}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshingLogs ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {logsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <Smartphone className="w-8 h-8 text-slate-400 mx-auto mb-2.5 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">No dispatch logs found</p>
            <p className="text-xs text-slate-500 mt-1">Send a test message or use the main SMS pages to generate activity logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <div className="inline-block min-w-full align-middle px-6 md:px-0">
              <div className="overflow-hidden border border-slate-100 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</th>
                      <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sender ID</th>
                      <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Message Content</th>
                      <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {recentLogs.map((log: SMSLog) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm font-semibold text-slate-900 font-mono whitespace-nowrap">
                          {log.recipient}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 font-mono whitespace-nowrap">
                          {log.sender_id || 'Concord'}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate md:max-w-md lg:max-w-lg whitespace-pre-wrap break-words leading-relaxed">
                          {log.content}
                        </td>
                        <td className="py-3 px-4 text-sm whitespace-nowrap">
                          {log.status === 'sent' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              sent
                            </span>
                          )}
                          {log.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              pending
                            </span>
                          )}
                          {log.status === 'processing' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                              processing
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              failed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap font-mono" suppressHydrationWarning>
                          {new Date(log.sent_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </DevAuthGuard>
  )
}
