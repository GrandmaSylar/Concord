'use server'

import { createClient as createSSRClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Vanilla client for public/global queries that don't need user cookies
const globalSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Admin client to query system-wide messages for diagnostics, bypassing RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

export async function getRecentSMSLogs() {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await adminSupabase
    .from('messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching recent SMS logs:', error)
    return []
  }

  return data || []
}

export async function prepareSimulationQueue(count: number) {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    // Delete existing simulation data
    await adminSupabase
      .from('messages')
      .delete()
      .like('content', '[SIMULATION-DRYRUN]%')

    // Build X records
    const mockMessages = []
    for (let i = 1; i <= count; i++) {
      mockMessages.push({
        user_id: user.id,
        recipient: `233${String(i).padStart(9, '0')}`,
        content: `[SIMULATION-DRYRUN] Campaign recipient #${i} - Testing high-volume performance.`,
        status: 'pending',
        sender_id: 'SIMULATOR'
      })
    }

    // Insert in chunks of 500
    for (let offset = 0; offset < mockMessages.length; offset += 500) {
      const chunk = mockMessages.slice(offset, offset + 500)
      const { error } = await adminSupabase.from('messages').insert(chunk)
      if (error) throw error
    }

    return { success: true }
  } catch (err: any) {
    console.error('Simulation preparation failed:', err)
    return { error: err.message || 'Failed to prepare simulation queue.' }
  }
}

export async function getSimulationStats() {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    const statuses = ['pending', 'processing', 'sent', 'failed'] as const
    const countPromises = statuses.map(async (status) => {
      const { count, error } = await adminSupabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .like('content', '[SIMULATION-DRYRUN]%')
        .eq('status', status)

      if (error) throw error
      return { status, count: count || 0 }
    })

    const results = await Promise.all(countPromises)
    const counts = { pending: 0, processing: 0, sent: 0, failed: 0 }
    results.forEach(({ status, count }) => {
      counts[status] = count
    })

    return counts
  } catch (err: any) {
    console.error('Failed to get simulation stats:', err)
    return { pending: 0, processing: 0, sent: 0, failed: 0 }
  }
}

// Global state tracking for halting simulations
let isSimulationHalted = false

export async function haltSimulation() {
  isSimulationHalted = true
  console.log(`[SIMULATION] Halt command received! Aborting local background wave threads.`)
  
  // Revert any messages currently in 'processing' status to 'pending' to prevent locked states
  try {
    const { data: processingMsgs } = await adminSupabase
      .from('messages')
      .select('id')
      .eq('status', 'processing')
      .like('content', '[SIMULATION-DRYRUN]%')
      
    if (processingMsgs && processingMsgs.length > 0) {
      const ids = processingMsgs.map((m) => m.id)
      const { error } = await adminSupabase
        .from('messages')
        .update({ status: 'pending' })
        .in('id', ids)
      
      if (error) throw error
      console.log(`[SIMULATION] Clean rollback: Reverted ${ids.length} 'processing' messages to 'pending'.`)
    }
  } catch (err: any) {
    console.error('Failed to rollback processing messages on halt:', err.message || err)
  }

  return { success: true }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function runLocalSimulationWave(waveCount: number, timeLimitMs: number, latencyMs: number, userId: string) {
  const startTime = Date.now()
  let totalProcessed = 0

  try {
    while (true) {
      // Pre-flight halt check
      if (isSimulationHalted) {
        console.log(`[LOCAL WAVE ${waveCount}] Wave execution aborted early due to user HALT signal.`)
        break
      }

      // Outer Keep-alive safety check
      if (Date.now() - startTime > timeLimitMs) {
        console.log(`[LOCAL WAVE ${waveCount}] Approaching safety threshold. Halting outer loop to trigger recursion.`)
        
        if (isSimulationHalted) {
          console.log(`[LOCAL WAVE ${waveCount}] Wave aborted mid-execution during safety timeout check.`)
          break
        }

        // Count remaining pending
        const { count, error: countError } = await adminSupabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')

        if (!countError && count && count > 0 && !isSimulationHalted) {
          console.log(`[LOCAL WAVE ${waveCount}] Auto-chaining recursion: ${count} pending messages remaining.`)
          // Simulate Deno background trigger recursively using background microtask
          setTimeout(() => runLocalSimulationWave(waveCount + 1, timeLimitMs, latencyMs, userId), 100)
        }
        break
      }

      // 1. Fetch up to 200 pending messages
      const { data: messages, error: fetchError } = await adminSupabase
        .from('messages')
        .select('*')
        .eq('status', 'pending')
        .limit(200)

      if (fetchError) throw fetchError

      if (!messages || messages.length === 0) {
        console.log(`[LOCAL WAVE ${waveCount}] Queue is fully drained!`)
        break
      }

      if (isSimulationHalted) {
        console.log(`[LOCAL WAVE ${waveCount}] Wave execution halted after fetch.`)
        break
      }

      const messageIds = messages.map((m) => m.id)

      // 2. Mark them as processing in the DB to prevent double-sending
      await adminSupabase
        .from('messages')
        .update({ status: 'processing' })
        .in('id', messageIds)

      // 3. Group messages by content and sender
      const groupedMessages: Record<string, { sender?: string; content: string; msgs: any[] }> = {}
      for (const msg of messages) {
        const sender = msg.sender_id || 'default'
        const key = `${sender}::${msg.content}`
        if (!groupedMessages[key]) {
          groupedMessages[key] = { sender: msg.sender_id || undefined, content: msg.content, msgs: [] }
        }
        groupedMessages[key].msgs.push(msg)
      }

      const groups = Object.values(groupedMessages)
      const CHUNK_SIZE = 20
      let haltedMidBatch = false

      // 4. Send groups in parallel chunks of 20 concurrent requests
      for (let i = 0; i < groups.length; i += CHUNK_SIZE) {
        // Halt check before dispatching the chunk
        if (isSimulationHalted) {
          console.log(`[LOCAL WAVE ${waveCount}] Halted mid-batch by user! Reverting unprocessed lock records.`)
          const remainingGroups = groups.slice(i)
          const remainingIds = []
          for (const g of remainingGroups) {
            remainingIds.push(...g.msgs.map((m) => m.id))
          }
          if (remainingIds.length > 0) {
            await adminSupabase
              .from('messages')
              .update({ status: 'pending' })
              .in('id', remainingIds)
          }
          haltedMidBatch = true
          break
        }

        // Double-safety check: If we're already running out of time during chunk processing!
        if (Date.now() - startTime > timeLimitMs) {
          console.log(`[LOCAL WAVE ${waveCount}] Time limit reached! Halting batch processing mid-execution.`)
          
          // Revert any unprocessed groups in this batch back to 'pending' in the database
          const remainingGroups = groups.slice(i)
          const remainingIds = []
          for (const g of remainingGroups) {
            remainingIds.push(...g.msgs.map((m) => m.id))
          }
          if (remainingIds.length > 0) {
            console.log(`[LOCAL WAVE ${waveCount}] Slicing and rolling back ${remainingIds.length} unprocessed records back to 'pending'...`)
            await adminSupabase
              .from('messages')
              .update({ status: 'pending' })
              .in('id', remainingIds)
          }
          haltedMidBatch = true
          break
        }

        const chunk = groups.slice(i, i + CHUNK_SIZE)
        
        // Dispatch concurrent parallel mock sends
        await Promise.all(
          chunk.map(async ({ sender, content, msgs }) => {
            try {
              // Simulated Network Latency
              if (latencyMs > 0) {
                await delay(latencyMs)
              }

              // Double check halt before marking as sent
              if (isSimulationHalted) {
                // If halted while waiting for latency delay, revert to pending
                const idsToUpdate = msgs.map((m) => m.id)
                await adminSupabase
                  .from('messages')
                  .update({ status: 'pending' })
                  .in('id', idsToUpdate)
                return
              }

              // Update DB status to sent
              const idsToUpdate = msgs.map((m) => m.id)
              await adminSupabase
                .from('messages')
                .update({ status: 'sent' })
                .in('id', idsToUpdate)

            } catch (err: any) {
              console.error("Mock send failed:", err.message)
            }
          })
        )
      }

      // Check if we need to recurse due to mid-batch halt
      if (haltedMidBatch) {
        if (isSimulationHalted) {
          break
        }
        const { count, error: countError } = await adminSupabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')

        if (!countError && count && count > 0 && !isSimulationHalted) {
          console.log(`[LOCAL WAVE ${waveCount}] Auto-chaining recursion (mid-batch halt): ${count} pending messages remaining.`)
          setTimeout(() => runLocalSimulationWave(waveCount + 1, timeLimitMs, latencyMs, userId), 100)
        }
        break
      }

      totalProcessed += messages.length
    }
  } catch (err: any) {
    console.error("Simulated execution wave error:", err.message)
  }
}

export async function triggerSimulationRun(
  timeLimitMs: number,
  latencyMs: number
): Promise<{ success: boolean; error?: string; data?: { message: string } }> {
  try {
    // Reset halt flag when launching a new simulation run
    isSimulationHalted = false

    // Get active user ID for logging/linking
    const supabase = await createSSRClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || '00000000-0000-0000-0000-000000000000'

    // Always use the local server-side simulation fallback.
    // The hosted Deno Edge Function's fire-and-forget self-recursion fetch()
    // doesn't survive Deno Deploy's isolate lifecycle — the isolate terminates
    // before the TCP request is fully dispatched, causing the queue to stall
    // after Wave 1. The local Node.js setTimeout() recursion is 100% reliable.
    console.log(`[SIMULATION] Launching local server-side queue drainage (userId: ${userId}, timeout: ${timeLimitMs}ms, latency: ${latencyMs}ms)`)
    setTimeout(() => runLocalSimulationWave(1, timeLimitMs, latencyMs, userId), 50)

    return {
      success: true,
      data: {
        message: "Simulation launched via server-side background queue drainage."
      }
    }
  } catch (err: any) {
    console.error('Simulation triggering failed:', err)
    return {
      success: false,
      error: err.message || 'Failed to trigger simulation'
    }
  }
}

export async function clearSimulationQueue() {
  const supabase = await createSSRClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  try {
    const { error } = await adminSupabase
      .from('messages')
      .delete()
      .like('content', '[SIMULATION-DRYRUN]%')

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('Failed to clear simulation queue:', err)
    return { error: err.message || 'Failed to clear simulation queue.' }
  }
}

