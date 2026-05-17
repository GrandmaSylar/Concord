'use server'

import { createClient } from '@/utils/supabase/server'

export async function getMessageLogs() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching message logs:', error)
    return []
  }

  return data
}

export async function getDashboardStats() {
  const supabase = await createClient()

  const [contacts, messages, reminders] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('scheduled_reminders').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ])

  return {
    totalContacts: contacts.count || 0,
    totalMessagesSent: messages.count || 0,
    pendingReminders: reminders.count || 0,
  }
}
