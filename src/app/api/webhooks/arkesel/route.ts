import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Arkesel usually sends DLR via GET query parameters, e.g., ?id=123&status=Delivered
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') // This depends on how Arkesel's webhook payload is structured
  const status = searchParams.get('status')
  
  if (!id || !status) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Map Arkesel's status to our internal enum (pending, sent, failed)
  // For demonstration, assuming Arkesel returns 'Delivered', 'Undelivered', 'Rejected'
  let mappedStatus = 'sent'
  const normalizedStatus = status.toLowerCase()
  if (normalizedStatus.includes('fail') || normalizedStatus.includes('reject') || normalizedStatus.includes('undelivered')) {
    mappedStatus = 'failed'
  }

  // Update the message status
  // Note: For this to work perfectly, we need to save Arkesel's message ID into our `messages` table when sending.
  // For now, this is a placeholder structural implementation.
  const { error } = await supabaseAdmin
    .from('messages')
    .update({ status: mappedStatus })
    .eq('id', id) // Assuming 'id' matches our UUID, otherwise we need an `external_id` column

  if (error) {
    console.error('Webhook DB update failed:', error)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
