import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/utils/arkesel'

// This endpoint is designed to be triggered by a Cron Job (e.g., Vercel Cron)
// It bypasses RLS using the Service Role Key to process all due reminders across all users.

export async function GET(request: Request) {
  // 1. Validate authorization (Optional: Check a secret CRON_SECRET header to ensure only your cron can trigger this)
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Initialize Supabase Admin Client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Service Role configuration')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 3. Fetch pending reminders that are due to be sent
    const now = new Date().toISOString()
    const { data: reminders, error: fetchError } = await supabaseAdmin
      .from('scheduled_reminders')
      .select('*, contacts(phone)')
      .eq('status', 'pending')
      .lte('trigger_time', now)
      .limit(50) // Process in batches

    if (fetchError) throw fetchError

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No pending reminders to process' })
    }

    // 4. Mark them as processing to prevent double-sending if another cron triggers concurrently
    const reminderIds = reminders.map(r => r.id)
    await supabaseAdmin
      .from('scheduled_reminders')
      .update({ status: 'processing' })
      .in('id', reminderIds)

    // 5. Send the SMS messages
    const results = await Promise.all(reminders.map(async (reminder) => {
      try {
        const phone = reminder.contacts?.phone
        if (!phone) throw new Error('No phone number found for contact')

        // Send via Arkesel
        const response = await sendSMS([phone], reminder.message)
        
        if (response && response.success) {
          // Success
          await supabaseAdmin
            .from('scheduled_reminders')
            .update({ status: 'sent' })
            .eq('id', reminder.id)

          // Also log to the main messages table
          await supabaseAdmin.from('messages').insert({
            user_id: reminder.user_id,
            recipient: phone,
            content: reminder.message,
            status: 'sent'
          })

          return { id: reminder.id, status: 'success' }
        } else {
          throw new Error('Arkesel API rejected the message')
        }
      } catch (err: any) {
        console.error(`Failed to send reminder ${reminder.id}:`, err)
        // Mark as failed
        await supabaseAdmin
          .from('scheduled_reminders')
          .update({ status: 'failed' })
          .eq('id', reminder.id)

        return { id: reminder.id, status: 'failed', error: err.message }
      }
    }))

    return NextResponse.json({
      message: `Processed ${reminders.length} reminders`,
      results
    })

  } catch (err: any) {
    console.error('Error in reminder processing cron:', err)
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}
