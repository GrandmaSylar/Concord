'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache'
import { adminSupabase } from '@/utils/supabase/static'

export async function getTemplates() {
 return unstable_cache(
 async () => {
 const { data, error } = await adminSupabase
 .from('templates')
 .select('*')
 .order('created_at', { ascending: false })

 if (error) {
 console.error('Error fetching templates:', error)
 return []
 }

 return (data || []).map(t => ({
 id: t.id,
 name: t.title, // Map database 'title' to frontend 'name'
 content: t.content,
 created_at: t.created_at
 }))
 },
 ['templates'],
 { tags: ['templates'] }
 )()
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
 title: name.trim(), // Map frontend 'name' to database 'title'
 content: content.trim(),
 })

 if (error) {
 console.error('Error adding template:', error)
 return { error: 'Failed to add template.' }
 }

 revalidateTag('templates', 'max')
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

 revalidateTag('templates', 'max')
 revalidatePath('/templates')
 return { success: true }
}
