'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getScheduledByMonth(year: number, month: number) {
 const supabase = await createClient()

 // month is 0-indexed (JS Date convention)
 const startDate = new Date(year, month, 1).toISOString()
 const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

 const { data, error } = await supabase
 .from('scheduled_reminders')
 .select('id, contact_id, message, trigger_time, status, contacts(name, phone)')
 .gte('trigger_time', startDate)
 .lte('trigger_time', endDate)
 .order('trigger_time', { ascending: true })

 if (error) {
 console.error('Error fetching scheduled by month:', error)
 return []
 }

 return data || []
}

export async function rescheduleReminder(reminderId: string, newTriggerTime: string) {
 const supabase = await createClient()
 const { data: { user } } = await supabase.auth.getUser()
 if (!user) throw new Error('Unauthorized')

 const { error } = await supabase
 .from('scheduled_reminders')
 .update({ trigger_time: newTriggerTime })
 .eq('id', reminderId)

 if (error) {
 console.error('Error rescheduling reminder:', error)
 return { error: error.message }
 }

 revalidatePath('/scheduled')
 return { success: true }
}
