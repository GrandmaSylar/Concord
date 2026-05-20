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

/**
 * Fetches real-time message queue stats for the dashboard live monitor.
 * Excludes simulation dry-run messages to show only production traffic.
 */
export async function getLiveMessageQueueStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // We need a service role client to bypass RLS for system-wide counts
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const statuses = ['pending', 'processing', 'sent', 'failed'] as const

    // Get counts per status, excluding simulation messages
    const countPromises = statuses.map(async (status) => {
      const { count, error } = await adminSupabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .not('content', 'like', '[SIMULATION-DRYRUN]%')
        .eq('status', status)

      if (error) throw error
      return { status, count: count || 0 }
    })

    // Get the 8 most recent messages that are actively being processed or pending
    const recentActivityPromise = adminSupabase
      .from('messages')
      .select('id, recipient, content, status, sent_at, sender_id')
      .not('content', 'like', '[SIMULATION-DRYRUN]%')
      .in('status', ['pending', 'processing'])
      .order('sent_at', { ascending: false })
      .limit(8)

    // Get the most recently completed messages (sent or failed in the last hour)
    const recentCompletedPromise = adminSupabase
      .from('messages')
      .select('id, recipient, content, status, sent_at, sender_id')
      .not('content', 'like', '[SIMULATION-DRYRUN]%')
      .in('status', ['sent', 'failed'])
      .order('sent_at', { ascending: false })
      .limit(5)

    const [countResults, recentActivity, recentCompleted] = await Promise.all([
      Promise.all(countPromises),
      recentActivityPromise,
      recentCompletedPromise
    ])

    const counts = { pending: 0, processing: 0, sent: 0, failed: 0 }
    countResults.forEach(({ status, count }) => {
      counts[status] = count
    })

    return {
      counts,
      activeMessages: recentActivity.data || [],
      recentCompleted: recentCompleted.data || []
    }
  } catch (err: any) {
    console.error('Failed to get live message queue stats:', err)
    return {
      counts: { pending: 0, processing: 0, sent: 0, failed: 0 },
      activeMessages: [],
      recentCompleted: []
    }
  }
}
