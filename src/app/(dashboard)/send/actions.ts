'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function getFilteredContacts(page: number, search: string, sort: string) {
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

export async function getAllFilteredContacts(search: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let query = supabase.from('contacts')
    .select('name, phone')
    .eq('user_id', user.id)
    .eq('opt_out', false)

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,group_name.ilike.%${search}%`)
  }

  const { data } = await query
  return data || []
}

// Replace merge tags in a message template with actual contact data
function personalize(template: string, contact: { name: string, phone: string }): string {
  const nameParts = contact.name.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''
  
  return template
    .replace(/\[Firstname\]/gi, firstName)
    .replace(/\[Lastname\]/gi, lastName)
    .replace(/\[Fullname\]/gi, contact.name)
    .replace(/\[Phone\]/gi, contact.phone)
}

const sendSmsSchema = z.object({
  recipients: z.string().min(1, 'Please select at least one recipient'),
  message: z.string().min(1, 'Message cannot be empty').max(1600, 'Message too long'),
})

export async function processBulkSMS(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Zod Validation
  const parsed = sendSmsSchema.safeParse({
    recipients: formData.get('recipients'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || 'Validation failed' }
  }

  const { recipients, message } = parsed.data
  
  let contactList: { name: string, phone: string }[] = []
  try {
    contactList = JSON.parse(recipients)
    if (!Array.isArray(contactList) || contactList.length === 0) throw new Error()
  } catch (e) {
    return { error: 'Invalid recipients data.' }
  }

  // 2. Personalize messages per contact (merge tags)
  const hasMergeTags = /\[(Firstname|Lastname|Fullname|Phone)\]/i.test(message)

  const logs = contactList.map(contact => ({
    user_id: user.id,
    recipient: contact.phone,
    content: hasMergeTags ? personalize(message, contact) : message,
    status: 'pending' // Queued for the background worker
  }))

  const { error: logError } = await supabase.from('messages').insert(logs)
  if (logError) {
    console.error('Error queuing messages:', logError)
    return { error: 'Failed to queue messages for dispatch.' }
  }

  revalidatePath('/reports')
  revalidatePath('/') // Revalidate dashboard stats
  return { success: true, count: contactList.length }
}
