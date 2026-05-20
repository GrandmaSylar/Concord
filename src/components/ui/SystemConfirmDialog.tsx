'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { ReactNode, useEffect } from 'react'

export type DialogType = 'info' | 'warning' | 'success' | 'danger'

interface SystemConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  confirmText?: string
  cancelText?: string
  type?: DialogType
  isLoading?: boolean
}

const typeConfig = {
  info: {
    icon: AlertCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    buttonColor: 'bg-theme-primary hover:opacity-90',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    buttonColor: 'bg-amber-500 hover:bg-amber-600',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
  },
  danger: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
}

export default function SystemConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
}: SystemConfirmDialogProps) {
  const config = typeConfig[type]
  const Icon = config.icon

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-950/40"
            onClick={isLoading ? undefined : onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
            }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/50"
          >
            {/* Ambient Glassmorphic Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[64px] opacity-20 pointer-events-none bg-theme-primary`} />
            
            <div className="p-6 relative z-10">
              <div className="flex flex-col items-center text-center gap-4">
                
                {/* Pulsing Icon */}
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className={`p-3 rounded-2xl ${config.bg} shadow-inner`}
                >
                  <Icon className={`w-8 h-8 ${config.color}`} />
                </motion.div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {title}
                  </h3>
                  <div className="text-sm text-slate-500 font-medium leading-relaxed">
                    {description}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-slate-50/80 p-4 border-t border-slate-100 flex gap-3 relative z-10">
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all disabled:opacity-60 ${config.buttonColor}`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : null}
                {isLoading ? 'Processing...' : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
