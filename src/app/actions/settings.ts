'use server'

import { createClient as createSSRClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Vanilla client for public/global queries that don't need user cookies
const globalSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface SystemSettings {
  id: string
  primary_color: string
  secondary_color: string
  login_bg_url: string | null
  watermark_url: string | null
  watermark_opacity: number
}

const SETTINGS_ID = '11111111-1111-1111-1111-111111111111'

import { sendSMS } from '@/utils/arkesel'

export async function getSystemSettings(): Promise<SystemSettings | null> {
  const { data, error } = await globalSupabase
    .from('system_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .maybeSingle()

  if (error) {
    console.error('Error fetching system settings:', JSON.stringify(error, null, 2))
    return null
  }

  return data
}

export async function updateSystemSettings(settings: Partial<SystemSettings>) {
  const supabase = await createSSRClient()
  
  const { error } = await supabase
    .from('system_settings')
    .update(settings)
    .eq('id', SETTINGS_ID)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function sendTestSMS(phone: string) {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  if (!phone || phone.trim().length === 0) {
    return { error: 'Phone number is required' }
  }

  const result = await sendSMS(
    [phone], 
    'Concord SMS: Hello! This is a test message confirming that your integration is working properly. 🚀'
  )

  if (result.error) {
    return { error: result.error }
  }

  return { 
    success: true, 
    status: result.status || 'success',
    details: result.data || result
  }
}

