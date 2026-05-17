'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Phone number regex: Allows optional +, spaces, dashes, and digits. Must have at least 9 digits.
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format').min(9, 'Phone number too short'),
  group_name: z.string().optional(),
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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || 'Validation failed' }
  }

  // Normalize phone number (strip spaces, dashes, parentheses)
  let { name, phone, group_name } = parsed.data
  phone = phone.replace(/[\s\-\(\)]/g, '')

  const { error } = await supabase.from('contacts').insert({
    user_id: user.id,
    name: name.trim(),
    phone,
    group_name: group_name ? group_name.trim() : null,
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
