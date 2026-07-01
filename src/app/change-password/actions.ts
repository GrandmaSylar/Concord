'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Password validator matching robust rules:
// - At least 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one digit
// - At least one special character (@$!%*?&)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

export async function updatePassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Both password fields are required.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      error: 'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. @, $, !, %, *, ?, &).'
    }
  }

  const supabase = await createClient()

  // 1. Get currently authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Authentication required. Please log in again.' }
  }

  // 2. Update password in Supabase Auth
  const { error: authError } = await supabase.auth.updateUser({ password })
  if (authError) {
    return { error: `Failed to update password: ${authError.message}` }
  }

  // 3. Clear the force_password_change flag in the user's profile
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ force_password_change: false })
    .eq('id', user.id)

  if (profileError) {
    return { error: `Password updated, but profile status could not be saved: ${profileError.message}` }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
