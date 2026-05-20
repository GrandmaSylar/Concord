'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function addReminder(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const recipientsRaw = formData.get('recipients') as string
  const message = formData.get('message') as string
  const trigger_time = formData.get('trigger_time') as string
  const sender_id = formData.get('senderId') as string

  if (!recipientsRaw || !message || !trigger_time) {
    return { error: 'All fields are required.' }
  }

  let contactList: { id: string, name: string, phone: string, position?: string, sub_area?: string, polling_station?: string }[] = []
  try {
    contactList = JSON.parse(recipientsRaw)
    if (!Array.isArray(contactList) || contactList.length === 0) throw new Error()
  } catch {
    return { error: 'Invalid recipients data.' }
  }

  const allowedSenders = ['Rachael-RTK', 'RachaelWG', 'RTK4SERVICE']
  const senderId = allowedSenders.includes(sender_id) ? sender_id : 'Rachael-RTK'

  const hasMergeTags = /\[(Firstname|Lastname|Fullname|Phone|Position|SubArea|Station)\]/i.test(message)

  const reminders = contactList.map(contact => ({
    user_id: user.id,
    contact_id: contact.id,
    message: hasMergeTags ? personalize(message, contact).trim() : message.trim(),
    trigger_time: new Date(trigger_time).toISOString(),
    sender_id: senderId
  }))

  const { error } = await supabase.from('scheduled_reminders').insert(reminders)

  if (error) {
    console.error('Error adding reminders:', error)
    return { error: 'Failed to schedule reminders.' }
  }

  // Trigger the Edge Function to check/process reminders immediately
  try {
    const { error: invokeError } = await supabase.functions.invoke('process-reminders')
    if (invokeError) {
      console.error('Error invoking process-reminders edge function:', invokeError)
    }
  } catch (err) {
    console.error('Failed to invoke process-reminders edge function:', err)
  }

  revalidatePath('/reminders')
  revalidatePath('/scheduled')
  return { success: true }
}

export async function getUpcomingReminders() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('scheduled_reminders')
    .select(`
      *,
      contacts (
        name,
        phone
      )
    `)
    .order('trigger_time', { ascending: true })

  if (error) {
    console.error('Error fetching scheduled messages:', error)
    return []
  }

  return data
}

export async function cancelReminder(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('scheduled_reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error canceling reminder:', error)
    return { error: 'Failed to cancel.' }
  }

  revalidatePath('/reminders')
  revalidatePath('/scheduled')
  return { success: true }
}
