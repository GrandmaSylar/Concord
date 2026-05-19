'use client'

import { use, useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Lock, Mail, Eye, EyeOff, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { login } from './actions'

const PROMPTS = [
  {
    title: 'High-Capacity Dispatches',
    description: 'Execute high-throughput SMS campaigns using premium direct local routes.',
    icon: Send,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    title: 'Precise Target Selection',
    description: 'Leverage multi-level constituency filters to target exact demographics instantly.',
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Enterprise-Grade Security',
    description: 'Keep stakeholder communication secure with strict role-based authorization.',
    icon: Lock,
    color: 'from-emerald-500 to-teal-500',
  },
]

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const params = use(searchParams)
  const errorMessage = params.message

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [activePrompt, setActivePrompt] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [customError, setCustomError] = useState<string | null>(null)

  // Rotate prompts every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePrompt((prev) => (prev + 1) % PROMPTS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Auto-clear error when inputs change
  useEffect(() => {
    setCustomError(null)
  }, [email, password])

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCustomError(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    startTransition(async () => {
      try {
        await login(formData)
      } catch (err: any) {
        // Next.js redirect throws an expected error to trigger redirection.
        // If it returns or throws an actual auth failure, handle it:
        if (err && !err.message?.includes('NEXT_REDIRECT')) {
          setCustomError('Failed to establish session. Please verify credentials.')
        }
      }
    })
  }

  const CurrentIcon = PROMPTS[activePrompt].icon

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans select-none">
      
      {/* ── Ambient Background Lighting ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -60, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[150px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(10,10,10,0.85))] pointer-events-none" />
      </div>

      {/* ── Main Container ── */}
      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center">
        
        {/* ── Left Side: Interactive Features Showcase ── */}
        <div className="md:col-span-6 space-y-8 hidden md:block pr-6">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Next-Gen Messaging Engine
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-none"
            >
              Concord <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">SMS</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base text-slate-400 max-w-md"
            >
              Streamlined broadcast capabilities, dynamic target segments, and enterprise reliability.
            </motion.p>
          </div>

          {/* Interactive Feature Slider Card */}
          <div className="relative min-h-[160px] bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePrompt}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${PROMPTS[activePrompt].color} text-white shadow-lg`}>
                    <CurrentIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{PROMPTS[activePrompt].title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {PROMPTS[activePrompt].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Slider Dots Indicator */}
            <div className="flex gap-1.5 mt-6">
              {PROMPTS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePrompt(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activePrompt ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Side: Glassmorphism Login Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-8 shadow-2xl relative overflow-hidden">
            
            {/* Ambient Card Accent Light */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center md:text-left mb-8 space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm text-slate-400">
                Sign in to your administration dashboard.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-6">
              
              {/* Inputs Group */}
              <div className="space-y-4">
                
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold text-slate-400">
                    Email address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={isPending}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@concord.org"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-xs font-semibold text-slate-400">
                      Password
                    </label>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      disabled={isPending}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500/50 rounded-xl py-3 pl-11 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Alert Prompts */}
              <AnimatePresence>
                {(errorMessage || customError) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="flex gap-2.5 items-start p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{customError || errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Button with Dynamic States */}
              <motion.button
                whileHover={{ scale: isPending ? 1 : 1.015 }}
                whileTap={{ scale: isPending ? 1 : 0.985 }}
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-blue-500/15"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Establishing Secure Connection...</span>
                  </>
                ) : (
                  <span>Access Dashboard</span>
                )}
              </motion.button>

              <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-800/60">
                Powered by <span className="text-slate-400 font-semibold">PhiNova</span>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
