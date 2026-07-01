'use client'

import { useState, useActionState, useEffect } from 'react'
import { updatePassword } from './actions'
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck, Check, X, Loader2 } from 'lucide-react'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, isPending] = useActionState(updatePassword, null)

  // Password rules validation states
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[@$!%*?&]/.test(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && passwordsMatch

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 font-sans select-none">
      
      {/* Ambient colored lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-theme-primary opacity-10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-indigo-600 opacity-10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-8 shadow-2xl overflow-hidden">
        
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Secure Password Required
          </h2>
          <p className="text-sm text-slate-400">
            Please update your temporary password to secure your account.
          </p>
        </div>

        <form action={formAction} className="space-y-5">
          
          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              New Secure Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isPending}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
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

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              Confirm New Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isPending}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Rules Indicator Grid */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password Requirements</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={hasMinLength ? 'text-emerald-400/90' : 'text-slate-500'}>8+ Characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasUppercase ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={hasUppercase ? 'text-emerald-400/90' : 'text-slate-500'}>1 Uppercase Letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasLowercase ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={hasLowercase ? 'text-emerald-400/90' : 'text-slate-500'}>1 Lowercase Letter</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={hasNumber ? 'text-emerald-400/90' : 'text-slate-500'}>1 Number</span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasSpecial ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={hasSpecial ? 'text-emerald-400/90' : 'text-slate-500'}>1 Special (@$!%*?&)</span>
              </div>
              <div className="flex items-center gap-1.5">
                {passwordsMatch ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span className={passwordsMatch ? 'text-emerald-400/90' : 'text-slate-500'}>Passwords Match</span>
              </div>
            </div>
          </div>

          {/* Action State Error Alert */}
          {state?.error && (
            <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-xl">
              <span className="leading-relaxed">{state.error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || !isFormValid}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-theme-primary px-4 py-3.5 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Updating Credentials...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Enforce Password Update</span>
              </>
            )}
          </button>

          <div className="text-center text-xs text-slate-500 pt-2">
            Powered by <span className="text-slate-400 font-semibold">PhiNova</span>
          </div>
        </form>
      </div>
    </div>
  )
}
