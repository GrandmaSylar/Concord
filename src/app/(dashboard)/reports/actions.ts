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

  const [
    contacts, 
    messagesSent, 
    messagesFailed, 
    messagesPending, 
    reminders,
    recentMessages,
    subAreas,
    positions
  ] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('scheduled_reminders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('messages').select('id, recipient, content, status, sent_at').order('sent_at', { ascending: false }).limit(5),
    supabase.from('contacts').select('sub_area'),
    supabase.from('contacts').select('position')
  ])

  // Process sub-areas distribution
  const subAreaCounts: Record<string, number> = {}
  subAreas.data?.forEach(c => {
    if (c.sub_area) {
      subAreaCounts[c.sub_area] = (subAreaCounts[c.sub_area] || 0) + 1
    }
  })
  const subAreaDistribution = Object.entries(subAreaCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Process positions distribution
  const positionCounts: Record<string, number> = {}
  positions.data?.forEach(c => {
    if (c.position) {
      positionCounts[c.position] = (positionCounts[c.position] || 0) + 1
    }
  })
  const positionDistribution = Object.entries(positionCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalContacts: contacts.count || 0,
    totalMessagesSent: messagesSent.count || 0,
    totalMessagesFailed: messagesFailed.count || 0,
    totalMessagesPending: messagesPending.count || 0,
    pendingReminders: reminders.count || 0,
    recentMessages: recentMessages.data || [],
    subAreaDistribution,
    positionDistribution
  }
}
