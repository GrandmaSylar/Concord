'use server'

import { createClient } from '@/utils/supabase/server'
import { unstable_cache, revalidatePath } from 'next/cache'

export async function getMessageLogs(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('messages')
    .select('*')
    .order('sent_at', { ascending: false })

  if (startDate) {
    query = query.gte('sent_at', startDate)
  }
  if (endDate) {
    query = query.lte('sent_at', `${endDate}T23:59:59.999Z`)
  }

  const { data, error } = await query.limit(100)

  if (error) {
    console.error('Error fetching message logs:', error)
    return []
  }

  return data
}

import { adminSupabase } from '@/utils/supabase/static'

export async function getDashboardStats() {
 return unstable_cache(
 async () => {
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
 adminSupabase.from('contacts').select('id', { count: 'exact', head: true }),
 adminSupabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
 adminSupabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
 adminSupabase.from('messages').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
 adminSupabase.from('scheduled_reminders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
 adminSupabase.from('messages').select('id, recipient, content, status, sent_at').order('sent_at', { ascending: false }).limit(5),
 adminSupabase.from('contacts').select('sub_area'),
 adminSupabase.from('contacts').select('position')
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
 },
 ['dashboard-stats'],
 { revalidate: 10 }
 )()
}

// Inner helper cached fetcher which runs statically and contains no cookie/auth calls
const getCachedLiveQueueStats = unstable_cache(
 async () => {
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
 },
 ['live-queue-stats'],
 { revalidate: 3 }
)

/**
 * Fetches real-time message queue stats for the dashboard live monitor.
 * Excludes simulation dry-run messages to show only production traffic.
 */
export async function getLiveMessageQueueStats() {
 // Check authorization dynamically using cookies OUTSIDE the cache helper
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
 throw new Error('Unauthorized')
 }

 // Call the static caching helper
 return getCachedLiveQueueStats()
}

/**
 * Ghana carrier prefix detection.
 * Returns the network name based on the phone number prefix.
 */
function detectCarrier(phone: string): string {
 // Normalize to local digits
 const digits = phone.replace(/\D/g, '')
 // Get the subscriber prefix (digits 4-5 for 233XXXXXXXXX or digits 2-3 for 0XXXXXXXXXX)
 let prefix = ''
 if (digits.startsWith('233') && digits.length >= 5) {
 prefix = digits.substring(3, 5)
 } else if (digits.startsWith('0') && digits.length >= 3) {
 prefix = digits.substring(1, 3)
 }

 const mtn = ['24', '25', '53', '54', '55', '59']
 const telecel = ['20', '50']
 const airtelTigo = ['26', '27', '56', '57']

 if (mtn.includes(prefix)) return 'MTN'
 if (telecel.includes(prefix)) return 'Telecel'
 if (airtelTigo.includes(prefix)) return 'AirtelTigo'
 return 'Other'
}

const SMS_UNIT_COST_GHS = 0.039

function calculateMessageParts(content: string): number {
  const gsm7Regex = /^[A-Za-z0-9@£$¥èéùìòÇ\n\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà\^{}\\[~\]|€]*$/;
  const isGsm = gsm7Regex.test(content);
  const length = content.length;

  if (isGsm) {
    if (length <= 160) return 1;
    return Math.ceil(length / 153);
  } else {
    if (length <= 70) return 1;
    return Math.ceil(length / 67);
  }
}

export async function getSMSAnalytics(startDate?: string, endDate?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch all non-simulation messages
  const limit = 1000
  let allMessages: any[] = []
  let from = 0

  while (true) {
    let query = supabase
      .from('messages')
      .select('recipient, content, status, sent_at')
      .not('content', 'like', '[SIMULATION-DRYRUN]%')
      .order('sent_at', { ascending: false })

    if (startDate) {
      query = query.gte('sent_at', startDate)
    }
    if (endDate) {
      query = query.lte('sent_at', `${endDate}T23:59:59.999Z`)
    }

    const { data, error } = await query.range(from, from + limit - 1)

    if (error) {
      console.error('Error fetching analytics:', error)
      break
    }
    if (!data || data.length === 0) break
    allMessages = allMessages.concat(data)
    if (data.length < limit) break
    from += limit
  }

 const total = allMessages.length
 const sent = allMessages.filter(m => m.status === 'sent').length
 const failed = allMessages.filter(m => m.status === 'failed').length
 const pending = allMessages.filter(m => m.status === 'pending').length

 // Carrier breakdown
 const carrierCounts: Record<string, { total: number; sent: number; failed: number }> = {}
 allMessages.forEach(m => {
 const carrier = detectCarrier(m.recipient || '')
 if (!carrierCounts[carrier]) {
 carrierCounts[carrier] = { total: 0, sent: 0, failed: 0 }
 }
 carrierCounts[carrier].total++
 if (m.status === 'sent') carrierCounts[carrier].sent++
 if (m.status === 'failed') carrierCounts[carrier].failed++
 })
 const carrierData = Object.entries(carrierCounts)
 .map(([name, stats]) => ({ name, ...stats }))
 .sort((a, b) => b.total - a.total)

 // Daily volume (last 30 days)
 const dailyCounts: Record<string, { sent: number; failed: number }> = {}
 const now = new Date()
 // Initialize 30 days
 for (let i = 29; i >= 0; i--) {
 const d = new Date(now)
 d.setDate(d.getDate() - i)
 const key = d.toISOString().substring(0, 10)
 dailyCounts[key] = { sent: 0, failed: 0 }
 }
 allMessages.forEach(m => {
 if (!m.sent_at) return
 const key = new Date(m.sent_at).toISOString().substring(0, 10)
 if (dailyCounts[key]) {
 if (m.status === 'sent') dailyCounts[key].sent++
 else if (m.status === 'failed') dailyCounts[key].failed++
 }
 })
 const timelineData = Object.entries(dailyCounts).map(([date, counts]) => ({
 date,
 label: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
 ...counts
 }))

  // Cost estimation
  const totalSmsParts = allMessages.reduce((acc, m) => {
    return acc + calculateMessageParts(m.content || '')
  }, 0)
  const estimatedCost = totalSmsParts * SMS_UNIT_COST_GHS

  // Group messages into campaign batches in memory
  // Uses a sliding window: compare new message time against the batch's LAST message (endTime)
  // so that a campaign running for 30+ minutes still clusters as one batch.
  // Content matching strips personalized merge fields (names, etc.) to match by template.
  const batchesList: any[] = []
  const sortedMessages = [...allMessages].sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime())

  // Normalize content to a template fingerprint (strip names and numbers that vary per recipient)
  const getContentFingerprint = (content: string) => {
    return (content || '')
      .replace(/^(Hi|Dear|Hello)\s+[A-Z][A-Z\s'-]+,/i, 'GREETING,') // Strip personalized greeting
      .replace(/\[SIMULATION-DRYRUN\]\s*Campaign recipient #\d+/g, '[SIM]') // Normalize simulation prefix
      .substring(0, 60)
  }

  sortedMessages.forEach(m => {
    if (!m.sent_at) return
    const time = new Date(m.sent_at).getTime()
    const fingerprint = getContentFingerprint(m.content || '')
    
    // Find a batch where this message's timestamp is within 5 minutes of the batch's LATEST message
    const matchingBatch = batchesList.find(b => {
      const timeDiff = time - b.endTime // Only look forward from the last message
      const contentMatches = b.fingerprint === fingerprint
      return timeDiff >= 0 && timeDiff <= 300000 && contentMatches // 5-minute sliding window
    })

    if (matchingBatch) {
      matchingBatch.messages.push(m)
      matchingBatch.endTime = Math.max(matchingBatch.endTime, time)
    } else {
      batchesList.push({
        id: `batch_${time}_${Math.random().toString(36).substring(2, 7)}`,
        content: m.content,
        fingerprint,
        startTime: time,
        endTime: time,
        messages: [m]
      })
    }
  })

  const batches = batchesList.map(b => {
    const totalCount = b.messages.length
    const sentCount = b.messages.filter((m: any) => m.status === 'sent').length
    const failedCount = b.messages.filter((m: any) => m.status === 'failed').length
    const pendingCount = b.messages.filter((m: any) => m.status === 'pending').length
    
    return {
      id: b.id,
      timestamp: new Date(b.startTime).toISOString(),
      content: b.content,
      total: totalCount,
      sent: sentCount,
      failed: failedCount,
      pending: pendingCount,
      successRate: totalCount > 0 ? Math.round((sentCount / totalCount) * 100) : 0
    }
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    summary: {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      estimatedCost: estimatedCost.toFixed(2),
      totalSmsParts,
    },
    carrierData,
    timelineData,
    batches
  }
}

export async function resendMessages(messageIds: string[], customContent?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!messageIds || messageIds.length === 0) {
    return { error: 'No messages selected' }
  }

  // 1. Fetch the source messages
  const { data: sourceMessages, error: fetchError } = await supabase
    .from('messages')
    .select('*')
    .in('id', messageIds)

  if (fetchError || !sourceMessages || sourceMessages.length === 0) {
    console.error('Error fetching source messages:', fetchError)
    return { error: 'Failed to retrieve selected messages.' }
  }

  // Mark the original failed messages as retried so they disappear from the failed console
  const { error: updateError } = await supabase
    .from('messages')
    .update({ retried: true })
    .in('id', messageIds)

  if (updateError) {
    console.error('Error marking source messages as retried:', updateError)
    // Non-blocking, continue execution
  }

  // 2. Clone them with pending status
  const logs = sourceMessages.map(m => ({
    user_id: user.id,
    recipient: m.recipient,
    content: customContent || m.content, // Use edited content if provided
    sender_id: m.sender_id || 'Rachael-RTK',
    status: 'pending'
  }))

  const { error: insertError } = await supabase.from('messages').insert(logs)
  if (insertError) {
    console.error('Error re-inserting messages:', insertError)
    return { error: 'Failed to re-queue messages.' }
  }

  // 3. Trigger edge function to process immediately
  try {
    const { error: invokeError } = await supabase.functions.invoke('process-messages')
    if (invokeError) {
      console.error('Error invoking process-messages on resend:', invokeError)
    }
  } catch (err) {
    console.error('Failed to invoke process-messages on resend:', err)
  }

  revalidatePath('/reports')
  revalidatePath('/')
  return { success: true, count: logs.length }
}

export async function getFailedMessageLogs(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('messages')
    .select('*')
    .eq('status', 'failed')
    .eq('retried', false) // Exclude previously retried dispatches
    .order('sent_at', { ascending: false })

  if (startDate) {
    query = query.gte('sent_at', startDate)
  }
  if (endDate) {
    query = query.lte('sent_at', `${endDate}T23:59:59.999Z`)
  }

  const { data, error } = await query.limit(1000) // Fetch failures up to limit

  if (error) {
    console.error('Error fetching failed message logs:', error)
    return []
  }

  return data || []
}

export async function getAnomalyContacts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const allContacts: any[] = []
  let from = 0
  const limit = 1000

  while (true) {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, phone, sub_area, group_name, polling_station')
      .eq('user_id', user.id)
      .not('phone', 'is', null)
      .range(from, from + limit - 1)

    if (error) {
      console.error('Error fetching contacts for anomalies:', error)
      break
    }
    allContacts.push(...(data || []))
    if (!data || data.length < limit) break
    from += limit
  }

  return allContacts.filter(c => {
    const cleanDigits = (c.phone || '').replace(/\D/g, '')
    return cleanDigits.length > 10
  })
}
