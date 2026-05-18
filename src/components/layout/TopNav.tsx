'use client'

import { logout } from '@/app/login/actions'
import { Menu, LogOut } from 'lucide-react'
import SmsBalanceBadge from './SmsBalanceBadge'

interface TopNavProps {
  user: {
    email: string
    fullName?: string
    role?: string
  }
}

export default function TopNav({ user }: TopNavProps) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center md:hidden">
        <button type="button" className="-ml-2 p-2 text-gray-500 hover:text-gray-700">
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-1 justify-end items-center gap-4">
        <SmsBalanceBadge />
        <div className="text-sm text-gray-700 hidden sm:block">
          <span className="font-medium">{user.fullName || user.email}</span>
          {user.role === 'admin' && (
            <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              Admin
            </span>
          )}
        </div>
        <form action={logout}>
          <button className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-500 transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </form>
      </div>
    </header>
  )
}
