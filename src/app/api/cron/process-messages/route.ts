import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/utils/arkesel'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Fetch pending immediate messages in batches (e.g., 100 at a time)
    const { data: messages, error: fetchError } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('status', 'pending')
      .limit(100)

    if (fetchError) throw fetchError

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: 'No pending bulk messages to process' })
    }

    // Mark them as processing
    const messageIds = messages.map(m => m.id)
    await supabaseAdmin
      .from('messages')
      .update({ status: 'processing' })
      .in('id', messageIds)

    // Group messages by content to optimize Arkesel bulk sending
    // (If 50 people get the exact same content, we can send one HTTP request with 50 comma-separated numbers)
    const groupedMessages: Record<string, typeof messages> = {}
    for (const msg of messages) {
      if (!groupedMessages[msg.content]) {
        groupedMessages[msg.content] = []
      }
      groupedMessages[msg.content].push(msg)
    }

    const results = []

    for (const [content, msgs] of Object.entries(groupedMessages)) {
      const recipients = msgs.map(m => m.recipient)
      const response = await sendSMS(recipients, content)

      const status = response?.success ? 'sent' : 'failed'
      const idsToUpdate = msgs.map(m => m.id)

      await supabaseAdmin
        .from('messages')
        .update({ status })
        .in('id', idsToUpdate)
      
      results.push({ content, count: recipients.length, status })
    }

    return NextResponse.json({
      message: `Processed ${messages.length} bulk messages`,
      results
    })

  } catch (err: any) {
    console.error('Error in bulk message processing cron:', err)
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}
