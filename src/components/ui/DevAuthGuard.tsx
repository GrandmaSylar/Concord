'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ShieldAlert, Lock, Loader2, Timer, AlertTriangle } from 'lucide-react'
import { verifyDevPassword } from '@/app/actions/settings'

// ── sessionStorage keys ────────────────────────────────────────────────────────
const SS_ATTEMPTS   = 'dev_auth_attempts'    // number of failed attempts this lockout cycle
const SS_LOCKOUTS   = 'dev_auth_lockouts'    // number of lockout cycles ever triggered this session
const SS_LOCKED_AT  = 'dev_auth_locked_at'  // timestamp (ms) when the current lockout started

const MAX_ATTEMPTS   = 5
// Lockout durations grow exponentially per cycle (seconds):
// cycle 1 → 30s, cycle 2 → 60s, cycle 3 → 120s, cycle 4 → 240s, …
const BASE_LOCKOUT_S = 30

function getLockoutDuration(cycle: number): number {
  return BASE_LOCKOUT_S * Math.pow(2, cycle - 1)
}

function readInt(key: string, fallback = 0): number {
  if (typeof window === 'undefined') return fallback
  const v = sessionStorage.getItem(key)
  return v ? parseInt(v, 10) || fallback : fallback
}

function writeInt(key: string, value: number) {
  sessionStorage.setItem(key, String(value))
}

interface Props {
  children: React.ReactNode
}

export default function DevAuthGuard({ children }: Props) {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword]           = useState('')
  const [error, setError]                 = useState('')
  const [isVerifying, setIsVerifying]     = useState(false)

  // lockout state
  const [attempts, setAttempts]             = useState(0)
  const [lockouts, setLockouts]             = useState(0)
  const [lockedAt, setLockedAt]             = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Bootstrap from sessionStorage on mount ──────────────────────────────────
  useEffect(() => {
    const att  = readInt(SS_ATTEMPTS, 0)
    const lkts = readInt(SS_LOCKOUTS, 0)
    const lat  = readInt(SS_LOCKED_AT, 0) || null

    setAttempts(att)
    setLockouts(lkts)
    setLockedAt(lat)

    // Do NOT restore an authenticated flag — always require password on mount.
  }, [])

  // ── Lockout countdown ticker ─────────────────────────────────────────────────
  const startTicker = useCallback((lockedTimestamp: number, cycleLockouts: number) => {
    if (tickerRef.current) clearInterval(tickerRef.current)

    tickerRef.current = setInterval(() => {
      const duration = getLockoutDuration(cycleLockouts) * 1000
      const elapsed  = Date.now() - lockedTimestamp
      const remaining = Math.ceil((duration - elapsed) / 1000)

      if (remaining <= 0) {
        // Lockout expired — reset attempt counter, keep lockout cycle count
        clearInterval(tickerRef.current!)
        tickerRef.current = null
        setLockedAt(null)
        setAttempts(0)
        setRemainingSeconds(0)
        sessionStorage.removeItem(SS_LOCKED_AT)
        writeInt(SS_ATTEMPTS, 0)
      } else {
        setRemainingSeconds(remaining)
      }
    }, 500)
  }, [])

  // ── Resume ticker if we reloaded while locked ────────────────────────────────
  useEffect(() => {
    if (lockedAt && lockouts > 0) {
      const duration  = getLockoutDuration(lockouts) * 1000
      const elapsed   = Date.now() - lockedAt
      if (elapsed < duration) {
        startTicker(lockedAt, lockouts)
      } else {
        // Already expired before render
        setLockedAt(null)
        setAttempts(0)
        sessionStorage.removeItem(SS_LOCKED_AT)
        writeInt(SS_ATTEMPTS, 0)
      }
    }
    return () => { if (tickerRef.current) clearInterval(tickerRef.current) }
  }, [lockedAt, lockouts, startTicker])

  // ── Derived state ────────────────────────────────────────────────────────────
  const isLocked       = lockedAt !== null && remainingSeconds > 0
  const attemptsLeft   = MAX_ATTEMPTS - attempts
  const lockoutSeconds = lockouts > 0 ? getLockoutDuration(lockouts) : getLockoutDuration(1)

  // ── Submit handler ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isVerifying || isLocked) return

    setIsVerifying(true)
    setError('')

    try {
      const res = await verifyDevPassword(password)

      if (res.success) {
        // Reset auth-failure counters on successful login
        writeInt(SS_ATTEMPTS, 0)
        sessionStorage.removeItem(SS_LOCKED_AT)
        setAttempts(0)
        setAuthenticated(true)
      } else {
        const newAttempts = attempts + 1
        writeInt(SS_ATTEMPTS, newAttempts)
        setAttempts(newAttempts)

        if (newAttempts >= MAX_ATTEMPTS) {
          // Trigger a lockout
          const newLockouts = lockouts + 1
          writeInt(SS_LOCKOUTS, newLockouts)
          setLockouts(newLockouts)

          const now = Date.now()
          writeInt(SS_LOCKED_AT, now)
          setLockedAt(now)

          const dur = getLockoutDuration(newLockouts)
          setRemainingSeconds(dur)
          startTicker(now, newLockouts)

          // Reset attempt counter for next window
          writeInt(SS_ATTEMPTS, 0)
          setAttempts(0)

          setError(`Too many failed attempts. Access locked for ${dur} seconds.`)
        } else {
          const left = MAX_ATTEMPTS - newAttempts
          setError(
            `Incorrect passphrase. ${left} attempt${left === 1 ? '' : 's'} remaining before lockout.`
          )
        }
        setPassword('')
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  // ── Render: authenticated ───────────────────────────────────────────────────
  if (authenticated) {
    return <>{children}</>
  }

  // ── Render: auth gate ────────────────────────────────────────────────────────
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header card */}
        <div className="bg-indigo-600 rounded-t-2xl px-6 py-8 text-white text-center relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <ShieldAlert className="w-56 h-56" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Developer Portal</h2>
            <p className="text-indigo-200 text-sm mt-1">Restricted access — authentication required</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-b-2xl shadow-2xl border border-t-0 border-slate-200 p-6">
          {isLocked ? (
            // ── Locked state ──────────────────────────────────────────────────
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                <Timer className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg">Access Locked</p>
                <p className="text-sm text-slate-500 mt-1">
                  Too many failed attempts. Try again in:
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl py-4 px-6">
                <span className="text-4xl font-mono font-bold text-red-600 tabular-nums">
                  {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}
                  :{(remainingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>
              {lockouts > 1 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Lockout #{lockouts} — each lockout increases the timeout duration.
                    Next lockout: {getLockoutDuration(lockouts + 1)}s.
                  </span>
                </div>
              )}
            </div>
          ) : (
            // ── Password entry ────────────────────────────────────────────────
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-slate-500">
                Enter the developer passphrase to access configuration settings.
              </p>

              {/* Attempt warning */}
              {attempts > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining before a {lockoutSeconds}s lockout.
                  </span>
                </div>
              )}

              <div>
                <input
                  type="password"
                  autoFocus
                  required
                  disabled={isVerifying}
                  placeholder="Passphrase..."
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="block w-full rounded-lg border border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm py-2.5 px-3 bg-white text-slate-900 transition-all disabled:opacity-50"
                />
                {error && (
                  <p className="mt-2 text-xs font-medium text-red-600 animate-in slide-in-from-top-1">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Authenticate'
                )}
              </button>

              {/* Attempt dots */}
              {attempts > 0 && (
                <div className="flex justify-center gap-1.5 pt-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < attempts ? 'bg-red-400' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
