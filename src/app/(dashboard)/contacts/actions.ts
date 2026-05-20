'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Phone number regex: Allows optional +, spaces, dashes, and digits. Must have at least 9 digits.
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format').min(9, 'Phone number too short'),
  group_name: z.string().optional(),
  position: z.string().optional(),
  sub_area: z.string().optional(),
  polling_station_code: z.string().optional(),
  polling_station: z.string().optional(),
})

export async function getContacts() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contacts:', error)
    return []
  }

  return data
}

export async function addContact(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = contactSchema.safeParse({
    name: formData.get('name') || '',
    phone: formData.get('phone') || '',
    group_name: formData.get('group_name') || '',
    position: formData.get('position') || '',
    sub_area: formData.get('sub_area') || '',
    polling_station_code: formData.get('polling_station_code') || '',
    polling_station: formData.get('polling_station') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || 'Validation failed' }
  }

  // Normalize phone number (strip spaces, dashes, parentheses)
  let { name, phone, group_name, position, sub_area, polling_station_code, polling_station } = parsed.data
  phone = phone.replace(/[\s\-\(\)]/g, '')

  const { error } = await supabase.from('contacts').insert({
    user_id: user.id,
    name: name.trim(),
    phone,
    group_name: group_name ? group_name.trim() : null,
    position: position ? position.trim() : null,
    sub_area: sub_area ? sub_area.trim() : null,
    polling_station_code: polling_station_code ? polling_station_code.trim() : null,
    polling_station: polling_station ? polling_station.trim() : null,
    has_contact: true
  })

  if (error) {
    console.error('Error adding contact:', error)
    return { error: 'Failed to add contact. Phone number might already exist.' }
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function bulkImportContacts(contacts: {name: string, phone: string, group_name: string}[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Sanitize phones
  const sanitizedContacts = contacts.map(c => ({
    user_id: user.id,
    name: c.name.trim(),
    phone: c.phone.replace(/\D/g, ''),
    group_name: c.group_name.trim() || 'Imported'
  }))

  const { error } = await supabase.from('contacts').insert(sanitizedContacts)

  if (error) {
    console.error('Bulk insert error:', error)
    return { error: 'Failed to import contacts.' }
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function toggleOptOut(contactId: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('contacts')
    .update({ opt_out: !currentStatus })
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Toggle opt-out error:', error)
    return { error: 'Failed to update opt-out status.' }
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function getContactFilterOptions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { groups: [], sub_areas: [], positions: [] }

  // Fetch unique non-null values for group_name, sub_area, and position
  const [
    { data: groupData },
    { data: subAreaData },
    { data: positionData }
  ] = await Promise.all([
    supabase.from('contacts').select('group_name').eq('user_id', user.id).not('group_name', 'is', null),
    supabase.from('contacts').select('sub_area').eq('user_id', user.id).not('sub_area', 'is', null),
    supabase.from('contacts').select('position').eq('user_id', user.id).not('position', 'is', null)
  ])

  // Extract unique values
  const groups = [...new Set((groupData || []).map(r => r.group_name))].filter(Boolean) as string[]
  const sub_areas = [...new Set((subAreaData || []).map(r => r.sub_area))].filter(Boolean) as string[]
  const positions = [...new Set((positionData || []).map(r => r.position))].filter(Boolean) as string[]

  // Sort them alphabetically
  groups.sort()
  sub_areas.sort()
  positions.sort()

  return { groups, sub_areas, positions }
}

export async function updateContact(contactId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const parsed = contactSchema.safeParse({
    name: formData.get('name') || '',
    phone: formData.get('phone') || '',
    group_name: formData.get('group_name') || '',
    position: formData.get('position') || '',
    sub_area: formData.get('sub_area') || '',
    polling_station_code: formData.get('polling_station_code') || '',
    polling_station: formData.get('polling_station') || '',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || 'Validation failed' }
  }

  let { name, phone, group_name, position, sub_area, polling_station_code, polling_station } = parsed.data
  phone = phone.replace(/[\s\-\(\)]/g, '')

  const { error } = await supabase
    .from('contacts')
    .update({
      name: name.trim(),
      phone,
      group_name: group_name ? group_name.trim() : null,
      position: position ? position.trim() : null,
      sub_area: sub_area ? sub_area.trim() : null,
      polling_station_code: polling_station_code ? polling_station_code.trim() : null,
      polling_station: polling_station ? polling_station.trim() : null,
    })
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating contact:', error)
    return { error: 'Failed to update contact. Phone number might already exist.' }
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function deleteContact(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting contact:', error)
    return { error: 'Failed to delete contact.' }
  }

  revalidatePath('/contacts')
  return { success: true }
}

