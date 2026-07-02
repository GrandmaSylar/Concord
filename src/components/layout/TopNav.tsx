'use client'

import { Menu, LogOut, RotateCw } from 'lucide-react'
import SmsBalanceBadge from './SmsBalanceBadge'
import { useState, useTransition } from 'react'
import SystemConfirmDialog from '../ui/SystemConfirmDialog'
import { logout } from '@/app/login/actions'
import { useRouter } from 'next/navigation'

interface TopNavProps {
 user: {
 email: string
 fullName?: string
 role?: string
 }
 onMenuClick: () => void
}

export default function TopNav({ user, onMenuClick }: TopNavProps) {
 const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
 const [isPending, startTransition] = useTransition()
 const router = useRouter()
 const [isRefreshing, setIsRefreshing] = useState(false)

 const handleRefresh = () => {
   setIsRefreshing(true)
   router.refresh()
   setTimeout(() => setIsRefreshing(false), 800)
 }

 const handleLogout = () => {
 // Clear dev settings lockout session keys upon logout
 if (typeof window !== 'undefined') {
   sessionStorage.removeItem('dev_auth_attempts')
   sessionStorage.removeItem('dev_auth_lockouts')
   sessionStorage.removeItem('dev_auth_locked_at')
 }
 startTransition(async () => {
   await logout()
 })
 }

 return (
 <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 relative z-20">
 <div className="flex flex-1 items-center md:hidden">
 <button 
 onClick={onMenuClick}
 type="button" 
 className="-ml-2 p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
 >
 <span className="sr-only">Open sidebar</span>
 <Menu className="h-6 w-6" aria-hidden="true" />
 </button>
 </div>
 <div className="flex flex-1 justify-end items-center gap-2 sm:gap-4">
 <SmsBalanceBadge />

 <button 
   onClick={handleRefresh}
   disabled={isRefreshing}
   className="flex items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-sm"
   title="Refresh page data"
 >
   <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
 </button>

 <div className="text-sm text-gray-700 hidden sm:block">
 <span className="font-medium">{user.fullName || user.email}</span>
 {user.role === 'admin' && (
 <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
 Admin
 </span>
 )}
 </div>
 <button 
 onClick={() => setShowLogoutConfirm(true)}
 className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
 >
 <LogOut className="h-4 w-4" />
 <span className="hidden sm:inline">Log out</span>
 </button>
 </div>

 <SystemConfirmDialog
 isOpen={showLogoutConfirm}
 onClose={() => setShowLogoutConfirm(false)}
 onConfirm={handleLogout}
 title="Exit Concord?"
 description="Are you sure you want to securely end your session and return to the login screen?"
 confirmText="Yes, Log out"
 cancelText="Cancel"
 type="danger"
 isLoading={isPending}
 />
 </header>
 )
}
