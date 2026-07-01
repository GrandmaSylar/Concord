import { ReactNode } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ResponsiveLayout from '@/components/layout/ResponsiveLayout'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()

 if (!user) {
 redirect('/login')
 }

 const { data: profile } = await supabase
 .from('profiles')
 .select('full_name, role, force_password_change')
 .eq('id', user.id)
 .single()

 if (profile?.force_password_change) {
 redirect('/change-password')
 }

 return (
 <ResponsiveLayout user={{ email: user.email!, fullName: profile?.full_name, role: profile?.role }}>
 {children}
 </ResponsiveLayout>
 )
}
