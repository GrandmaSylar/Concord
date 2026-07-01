'use client'

import { ReactNode, useState } from 'react'
import Sidebar from './Sidebar'
import TopNav from './TopNav'

interface Props {
 children: ReactNode
 user: {
 email: string
 fullName?: string
 role?: string
 }
}

export default function ResponsiveLayout({ children, user }: Props) {
 const [sidebarOpen, setSidebarOpen] = useState(false)

 return (
 <div className="flex h-screen bg-slate-50 overflow-hidden relative">
 {/* ── Dynamic Database System Watermark ── */}
 <div 
 className="absolute inset-0 pointer-events-none z-0 bg-center bg-no-repeat bg-cover"
 style={{ 
 backgroundImage: 'var(--theme-watermark)', 
 backgroundPosition: 'center 60%',
 opacity: 'var(--theme-watermark-opacity)'
 }}
 />
 
 <Sidebar mobileOpen={sidebarOpen} setMobileOpen={setSidebarOpen} />
 <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
 <TopNav 
 user={user} 
 onMenuClick={() => setSidebarOpen(true)} 
 />
 <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
 {children}
 </main>
 </div>
 </div>
 )
}
