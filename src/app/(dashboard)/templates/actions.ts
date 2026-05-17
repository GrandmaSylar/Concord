'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTemplates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching templates:', error)
    return []
  }

  return data
}

export async function addTemplate(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const name = formData.get('name') as string
  const content = formData.get('content') as string

  if (!name || !content) {
    return { error: 'Name and content are required.' }
  }

  const { error } = await supabase.from('templates').insert({
    user_id: user.id,
    name: name.trim(),
    content: content.trim(),
  })

  if (error) {
    console.error('Error adding template:', error)
    return { error: 'Failed to add template.' }
  }

  revalidatePath('/templates')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting template:', error)
    return { error: 'Failed to delete template.' }
  }

  revalidatePath('/templates')
  return { success: true }
}
