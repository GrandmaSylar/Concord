import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

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
      
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <TopNav user={{ email: user.email!, fullName: profile?.full_name, role: profile?.role }} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
