'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const adminSupabase = createAdminClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_ATTEMPTS = 5

export async function login(formData: FormData) {
 const email = (formData.get('email') as string)?.trim()
 const password = formData.get('password') as string

 if (!email || !password) {
 redirect('/login?message=Email and password are required')
 }

 // 1. Check if the user is currently locked out in the database
 const { data: profile } = await adminSupabase
 .from('profiles')
 .select('id, login_attempts, login_lockouts, login_locked_until')
 .eq('email', email)
 .maybeSingle()

 if (profile?.login_locked_until) {
 const lockedUntil = new Date(profile.login_locked_until).getTime()
 const now = Date.now()
 if (lockedUntil > now) {
 const remainingMs = lockedUntil - now
 const remainingSec = Math.ceil(remainingMs / 1000)
 redirect(`/login?message=Too many failed attempts. Account locked. Try again in ${remainingSec} seconds.`)
 }
 }

 // 2. Perform regular auth check
 const supabase = await createClient()
 const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

 if (authError) {
 // 3. Failed attempts: increment and lockout if threshold reached
 let cycle = profile?.login_lockouts || 0
 let attempts = (profile?.login_attempts || 0) + 1

 if (attempts >= MAX_ATTEMPTS) {
 cycle += 1
 attempts = 0 // Reset attempt counter for next lockout cycle
 
 // Calculate lockout duration (exponential timeout with no upper cap - increases infinitely)
 const durationSec = 30 * Math.pow(2, cycle - 1)
 const lockedUntil = new Date(Date.now() + durationSec * 1000).toISOString()

 if (profile?.id) {
 await adminSupabase
 .from('profiles')
 .update({
 login_attempts: 0,
 login_lockouts: cycle,
 login_locked_until: lockedUntil
 })
 .eq('id', profile.id)
 } else {
 // Fallback: lookup in auth.users by email to upsert profile record
 const { data: { users } } = await adminSupabase.auth.admin.listUsers()
 const match = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
 if (match) {
 await adminSupabase
 .from('profiles')
 .upsert({
 id: match.id,
 email: email,
 login_attempts: 0,
 login_lockouts: cycle,
 login_locked_until: lockedUntil
 })
 }
 }

 redirect(`/login?message=Too many failed attempts. Locked for ${durationSec} seconds.`)
 } else {
 // Just increment the attempt counter
 if (profile?.id) {
 await adminSupabase
 .from('profiles')
 .update({ login_attempts: attempts })
 .eq('id', profile.id)
 } else {
 const { data: { users } } = await adminSupabase.auth.admin.listUsers()
 const match = users.find(u => u.email?.toLowerCase() === email.toLowerCase())
 if (match) {
 await adminSupabase
 .from('profiles')
 .upsert({
 id: match.id,
 email: email,
 login_attempts: attempts
 })
 }
 }

 const left = MAX_ATTEMPTS - attempts
 redirect(`/login?message=Incorrect credentials. ${left} attempt${left === 1 ? '' : 's'} remaining before lockout.`)
 }
 }

 // 4. Success: reset failed attempts & lockout cycles
 const { data: { user } } = await supabase.auth.getUser()
 if (user) {
 await adminSupabase
 .from('profiles')
 .update({
 login_attempts: 0,
 login_lockouts: 0,
 login_locked_until: null
 })
 .eq('id', user.id)
 }

 revalidatePath('/', 'layout')
 redirect('/')
}



export async function logout() {
 const supabase = await createClient()
 await supabase.auth.signOut()
 redirect('/login')
}
