'use client'

import { useEffect, useState } from 'react'
import { getSmsBalance } from '@/app/actions/arkesel'
import { MessageSquareText, Wallet } from 'lucide-react'

// PhiNova Pricing Tiers based on Quotation PN-2026-0514
const calculateGhsValue = (smsCount: number): number => {
  if (smsCount <= 0) return 0;
  if (smsCount <= 645) return smsCount * 0.043;
  if (smsCount <= 1667) return smsCount * 0.042;
  if (smsCount <= 3448) return smsCount * 0.041;
  if (smsCount <= 7143) return smsCount * 0.039;
  if (smsCount <= 18519) return smsCount * 0.038;
  if (smsCount <= 38462) return smsCount * 0.036;
  return smsCount * 0.035; // 80,000+
}

export default function SmsBalanceBadge() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const bal = await getSmsBalance()
        setBalance(bal)
      } catch (e) {
        console.error("Failed to load SMS balance")
      } finally {
        setLoading(false)
      }
    }
    
    fetchBalance()
  }, [])

  if (loading) {
    return (
      <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 animate-pulse">
        <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
        <div className="w-24 h-3 bg-slate-200 rounded"></div>
      </div>
    )
  }

  if (balance === null) return null

  const ghsValue = calculateGhsValue(balance)

  return (
    <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:border-blue-200">
      <div className="flex items-center gap-1.5">
        <MessageSquareText className="w-4 h-4 text-blue-500" />
        <span>
          <strong className="text-gray-900">{balance.toLocaleString()}</strong> SMS
        </span>
      </div>
      <div className="w-px h-4 bg-slate-300"></div>
      <div className="flex items-center gap-1.5">
        <Wallet className="w-4 h-4 text-emerald-500" />
        <span className="text-emerald-700">
          ₵{ghsValue.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  )
}
