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
 const allData: any[] = []
 let from = 0
 const limit = 1000
 
 while (true) {
 const { data, error } = await supabase
 .from('contacts')
 .select('*')
 .order('created_at', { ascending: false })
 .range(from, from + limit - 1)

 if (error) {
 console.error('Error fetching contacts:', error)
 return allData.length > 0 ? allData : []
 }
 allData.push(...(data || []))
 if (!data || data.length < limit) break
 from += limit
 }

 return allData
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

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('contacts')
    .update({ opt_out: !currentStatus })
    .eq('id', contactId)

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { error } = await query

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

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  const allContacts: { group_name: string | null; sub_area: string | null; position: string | null }[] = []
  let from = 0
  const limit = 1000

  while (true) {
    let query = supabase
      .from('contacts')
      .select('group_name, sub_area, position')

    if (!isAdmin) {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query.range(from, from + limit - 1)

    if (error) {
      console.error('Error fetching contacts filter options:', error)
      break
    }
    allContacts.push(...(data || []))
    if (!data || data.length < limit) break
    from += limit
  }

  const groupsSet = new Set<string>()
  const subAreasSet = new Set<string>()
  const positionsSet = new Set<string>()

  for (const c of allContacts) {
    if (c.group_name) groupsSet.add(c.group_name)
    if (c.sub_area) subAreasSet.add(c.sub_area)
    if (c.position) positionsSet.add(c.position)
  }

  const groups = Array.from(groupsSet).sort()
  const sub_areas = Array.from(subAreasSet).sort()
  const positions = Array.from(positionsSet).sort()

  return { groups, sub_areas, positions }
}

export async function updateContact(contactId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

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

  let query = supabase
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

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { error } = await query

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

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)

  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { error } = await query

  if (error) {
    console.error('Error deleting contact:', error)
    return { error: 'Failed to delete contact.' }
  }

  revalidatePath('/contacts')
  return { success: true }
}
