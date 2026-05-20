'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Terminal, Palette, Image as ImageIcon, Check, Loader2, LogOut, Smartphone, Send, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { getSystemSettings, updateSystemSettings, sendTestSMS, SystemSettings } from '@/app/actions/settings'
import { toast } from 'sonner'

export default function DevSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
    </div>
  )
}
