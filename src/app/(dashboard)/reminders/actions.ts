'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addReminder(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const contact_id = formData.get('contact_id') as string
  const message = formData.get('message') as string
  const trigger_time = formData.get('trigger_time') as string

  if (!contact_id || !message || !trigger_time) {
    return { error: 'All fields are required.' }
  }

  const { error } = await supabase.from('scheduled_reminders').insert({
    user_id: user.id,
    contact_id,
    message: message.trim(),
    trigger_time: new Date(trigger_time).toISOString(),
  })

  if (error) {
    console.error('Error adding reminder:', error)
    return { error: 'Failed to schedule reminder.' }
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
