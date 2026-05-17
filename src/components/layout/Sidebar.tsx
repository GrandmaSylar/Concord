'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  FileText, 
  Clock, 
  Calendar, 
  BarChart2 
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Send SMS', href: '/send', icon: Send },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Reminders', href: '/reminders', icon: Clock },
  { name: 'Scheduled', href: '/scheduled', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)

  return (
    <div 
      className="hidden md:flex md:flex-shrink-0"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div 
        className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out ${
          expanded ? 'w-64' : 'w-[68px]'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center bg-slate-950 overflow-hidden px-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span 
              className={`text-xl font-bold tracking-tight text-white whitespace-nowrap transition-all duration-300 ${
                expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              } overflow-hidden`}
            >
              <span className="text-blue-400">Con</span>cord
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden py-4">
          <nav className="flex-1 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={true}
                  title={expanded ? undefined : item.name}
                  className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    }`}
                    aria-hidden="true"
                  />
                  <span 
                    className={`ml-3 whitespace-nowrap transition-all duration-300 ${
                      expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                    } overflow-hidden`}
                  >
                    {item.name}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 overflow-hidden">
          <div 
            className={`text-xs text-slate-500 text-center font-medium whitespace-nowrap transition-all duration-300 ${
              expanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Powered by PhiNova
          </div>
          <div 
            className={`text-xs text-slate-500 text-center font-medium transition-all duration-300 ${
              expanded ? 'opacity-0 h-0' : 'opacity-100'
            }`}
          >
            <span className="text-blue-400 font-bold text-base">N</span>
          </div>
        </div>
      </div>
    </div>
  )
}
