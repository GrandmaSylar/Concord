'use client'

import { useEffect, useState } from 'react'
import { getSmsBalance } from '@/app/actions/arkesel'
import { MessageSquareText } from 'lucide-react'

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
        <div className="w-16 h-3 bg-slate-200 rounded"></div>
      </div>
    )
  }

  if (balance === null) return null

  return (
    <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200">
      <MessageSquareText className="w-4 h-4 text-blue-500" />
      <span>
        <strong className="text-gray-900">{balance.toLocaleString()}</strong> SMS Credits
      </span>
    </div>
  )
}
