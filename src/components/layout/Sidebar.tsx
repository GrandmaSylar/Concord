'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Send, 
  FileText, 
  Clock, 
  Calendar, 
  BarChart2,
  Landmark,
  X,
  Lock
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Constituency', href: '/constituency', icon: Landmark },
  { name: 'Send SMS', href: '/send', icon: Send },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Reminders', href: '/reminders', icon: Clock },
  { name: 'Scheduled', href: '/scheduled', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  // Dev Settings State
  const [clickCount, setClickCount] = useState(0)
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showDevModal, setShowDevModal] = useState(false)
  const [devPassword, setDevPassword] = useState('')
  const [devError, setDevError] = useState('')

  const handleLogoClick = () => {
    setClickCount((prev) => {
      const newCount = prev + 1
      if (newCount === 7) {
        setShowDevModal(true)
        return 0
      }
      return newCount
    })

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = setTimeout(() => {
      setClickCount(0)
    }, 2000)
  }

  const handleDevSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (devPassword === process.env.NEXT_PUBLIC_DEV_ADMIN_PASSWORD) {
      setShowDevModal(false)
      setDevPassword('')
      setDevError('')
      router.push('/dev-settings')
    } else {
      setDevError('Incorrect password. Access denied.')
    }
  }

  return (
    <>
      <div 
        className="hidden md:flex md:flex-shrink-0 relative z-10"
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
            <div 
              className="flex items-center gap-2 flex-shrink-0 cursor-pointer select-none"
              onClick={handleLogoClick}
            >
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

      {/* Dev Portal Modal Overlay */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Restricted Portal</h3>
              </div>
              <button 
                onClick={() => setShowDevModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                Please enter the developer passphrase to access hidden configuration settings.
              </p>
              <form onSubmit={handleDevSubmit}>
                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      autoFocus
                      required
                      placeholder="Passphrase..."
                      value={devPassword}
                      onChange={(e) => {
                        setDevPassword(e.target.value)
                        setDevError('')
                      }}
                      className="block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3 border bg-white text-slate-900 transition-all"
                    />
                    {devError && (
                      <p className="mt-2 text-xs font-medium text-red-600 animate-in slide-in-from-top-1">
                        {devError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
