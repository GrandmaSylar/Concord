'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function getFilteredContacts(
  page: number, 
  search: string, 
  sort: string, 
  filters?: { sub_area?: string; position?: string; group_name?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { contacts: [], total: 0 }

  let query = supabase.from('contacts')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('opt_out', false)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,group_name.ilike.%${search}%`)
  }

  if (filters?.sub_area) query = query.eq('sub_area', filters.sub_area)
  if (filters?.position) query = query.eq('position', filters.position)
  if (filters?.group_name) query = query.eq('group_name', filters.group_name)

  if (sort === 'name_asc') query = query.order('name', { ascending: true })
  else if (sort === 'name_desc') query = query.order('name', { ascending: false })
  else if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else query = query.order('created_at', { ascending: false })

  const from = (page - 1) * 50
  const to = from + 49
  query = query.range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching contacts:', error)
    return { contacts: [], total: 0 }
  }

  return { contacts: data, total: count || 0 }
}

export async function getAllFilteredContacts(
  search: string,
  filters?: { sub_area?: string; position?: string; group_name?: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase.from('contacts')
    .select('id, name, phone, position, sub_area, polling_station')
    .eq('user_id', user.id)
    .eq('opt_out', false)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,group_name.ilike.%${search}%`)
  }

  if (filters?.sub_area) query = query.eq('sub_area', filters.sub_area)
  if (filters?.position) query = query.eq('position', filters.position)
  if (filters?.group_name) query = query.eq('group_name', filters.group_name)

  const { data } = await query
  return data || []
}

// Replace merge tags in a message template with actual contact data
function personalize(template: string, contact: { name: string, phone: string, position?: string, sub_area?: string, polling_station?: string }): string {
  const nameParts = contact.name.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  
  return template
    .replace(/\[Firstname\]/gi, firstName)
    .replace(/\[Lastname\]/gi, lastName)
    .replace(/\[Fullname\]/gi, contact.name)
    .replace(/\[Phone\]/gi, contact.phone)
    .replace(/\[Position\]/gi, contact.position || '')
    .replace(/\[SubArea\]/gi, contact.sub_area || '')
    .replace(/\[Station\]/gi, contact.polling_station || '')
}

const sendSmsSchema = z.object({
  recipients: z.string().optional(),
  tempNumbers: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(1600, 'Message too long'),
  senderId: z.enum(['Rachael-RTK', 'RachaelWG', 'RTK4SERVICE']),
})

export async function processBulkSMS(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Zod Validation
  const parsed = sendSmsSchema.safeParse({
    recipients: formData.get('recipients'),
    message: formData.get('message'),
    senderId: formData.get('senderId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || 'Validation failed' }
  }

  const { recipients, tempNumbers, message, senderId } = parsed.data
  
  let contactList: { name: string, phone: string, position?: string, sub_area?: string, polling_station?: string }[] = []
  
  if (recipients) {
    try {
      const parsedRecipients = JSON.parse(recipients)
      if (Array.isArray(parsedRecipients)) {
        contactList = parsedRecipients
      }
    } catch {
      return { error: 'Invalid recipients data.' }
    }
  }

  if (tempNumbers && tempNumbers.trim()) {
    const rawNumbers = tempNumbers.split(/[,;]/)
    for (const num of rawNumbers) {
      const cleanNum = num.replace(/[\s\-\(\)]/g, '')
      if (cleanNum.length >= 9) { // Basic sanity check for valid number length
        contactList.push({ name: 'Unknown', phone: cleanNum })
      }
    }
  }

  if (contactList.length === 0) {
    return { error: 'Please select at least one contact or enter a valid temporary number.' }
  }

  // 2. Personalize messages per contact (merge tags)
  const hasMergeTags = /\[(Firstname|Lastname|Fullname|Phone|Position|SubArea|Station)\]/i.test(message)

  const logs = contactList.map(contact => ({
    user_id: user.id,
    recipient: contact.phone,
    content: hasMergeTags ? personalize(message, contact) : message,
    sender_id: senderId,
    status: 'pending' // Queued for the background worker
  }))

  const { error: logError } = await supabase.from('messages').insert(logs)
  if (logError) {
    console.error('Error queuing messages:', logError)
    return { error: 'Failed to queue messages for dispatch.' }
  }

  // Trigger the Edge Function to process the queued messages immediately
  try {
    const { error: invokeError } = await supabase.functions.invoke('process-messages')
    if (invokeError) {
      console.error('Error invoking process-messages edge function:', invokeError)
    }
  } catch (err) {
    console.error('Failed to invoke process-messages edge function:', err)
  }

  revalidatePath('/reports')
  revalidatePath('/') // Revalidate dashboard stats
  return { success: true, count: contactList.length }
}
